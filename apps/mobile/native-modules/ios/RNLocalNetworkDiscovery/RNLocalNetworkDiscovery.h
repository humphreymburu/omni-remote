#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <Foundation/Foundation.h>
#import <Network/Network.h>
#import <sys/socket.h>
#import <netinet/in.h>
#import <arpa/inet.h>
#import <ifaddrs.h>

@interface RNLocalNetworkDiscovery : RCTEventEmitter <RCTBridgeModule>
@property (nonatomic, strong) NSMutableArray<NWConnection *> *activeConnections;
@property (nonatomic, strong) NSMutableArray<NWListener *> *activeListeners;
@end

@implementation RNLocalNetworkDiscovery

RCT_EXPORT_MODULE();

- (instancetype)init {
  if (self = [super init]) {
    _activeConnections = [NSMutableArray new];
    _activeListeners = [NSMutableArray new];
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onDeviceDiscovered", @"onDiscoveryError", @"onDiscoveryComplete"];
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

#pragma mark - SSDP Discovery (M-SEARCH over UDP multicast)

RCT_EXPORT_METHOD(startSSDPScan:(NSString *)searchTarget
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    int sock = socket(AF_INET, SOCK_DGRAM, 0);
    if (sock < 0) {
      reject(@"ERR_SOCKET", @"Failed to create UDP socket", nil);
      return;
    }

    // Set socket timeout
    struct timeval tv;
    tv.tv_sec = 1;
    tv.tv_usec = 0;
    setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));

    // Allow broadcast
    int broadcast = 1;
    setsockopt(sock, SOL_SOCKET, SO_BROADCAST, &broadcast, sizeof(broadcast));

    // Bind to any port
    struct sockaddr_in localAddr;
    memset(&localAddr, 0, sizeof(localAddr));
    localAddr.sin_family = AF_INET;
    localAddr.sin_addr.s_addr = INADDR_ANY;
    localAddr.sin_port = 0;

    if (bind(sock, (struct sockaddr *)&localAddr, sizeof(localAddr)) < 0) {
      close(sock);
      reject(@"ERR_BIND", @"Failed to bind UDP socket", nil);
      return;
    }

    // Construct SSDP M-SEARCH message
    NSString *searchTargetParam = searchTarget ?: @"ssdp:all";
    NSString *msearchMsg = [NSString stringWithFormat:
      @"M-SEARCH * HTTP/1.1\r\n"
      @"HOST: 239.255.255.250:1900\r\n"
      @"MAN: \"ssdp:discover\"\r\n"
      @"MX: 3\r\n"
      @"ST: %@\r\n"
      @"USER-AGENT: OmniRemote-iOS/1.0\r\n"
      @"\r\n", searchTargetParam];

    // Send to SSDP multicast address
    struct sockaddr_in multicastAddr;
    memset(&multicastAddr, 0, sizeof(multicastAddr));
    multicastAddr.sin_family = AF_INET;
    multicastAddr.sin_addr.s_addr = inet_addr("239.255.255.250");
    multicastAddr.sin_port = htons(1900);

    const char *msgBytes = [msearchMsg UTF8String];
    ssize_t sent = sendto(sock, msgBytes, strlen(msgBytes), 0,
                          (struct sockaddr *)&multicastAddr, sizeof(multicastAddr));

    if (sent < 0) {
      close(sock);
      reject(@"ERR_SEND", @"Failed to send SSDP M-SEARCH", nil);
      return;
    }

    // Collect responses for 5 seconds
    NSMutableSet *seenDevices = [NSMutableSet new];
    NSDate *deadline = [NSDate dateWithTimeIntervalSinceNow:5.0];

    while ([[NSDate date] timeIntervalSinceDate:deadline] < 0) {
      char buffer[4096];
      struct sockaddr_in fromAddr;
      socklen_t fromLen = sizeof(fromAddr);

      ssize_t len = recvfrom(sock, buffer, sizeof(buffer) - 1, 0,
                              (struct sockaddr *)&fromAddr, &fromLen);
      if (len > 0) {
        buffer[len] = '\0';
        NSString *response = [NSString stringWithUTF8String:buffer];

        // Parse SSDP response headers
        NSMutableDictionary *headers = [NSMutableDictionary new];
        NSArray *lines = [response componentsSeparatedByString:@"\r\n"];
        for (NSString *line in lines) {
          NSRange colonRange = [line rangeOfString:@":"];
          if (colonRange.location != NSNotFound) {
            NSString *key = [[line substringToIndex:colonRange.location]
              stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
            NSString *value = [[line substringFromIndex:colonRange.location + 1]
              stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
            headers[key.uppercaseString] = value;
          }
        }

        NSString *location = headers[@"LOCATION"] ?: @"";
        NSString *server = headers[@"SERVER"] ?: @"";
        NSString *usn = headers[@"USN"] ?: @"";

        if (usn.length > 0 && ![seenDevices containsObject:usn]) {
          [seenDevices addObject:usn];

          // Determine platform from headers
          NSString *platform = @"unknown";
          if ([server.lowercaseString containsString:@"roku"]) {
            platform = @"roku";
          } else if ([server.lowercaseString containsString:@"lg"]) {
            platform = @"lg-webos";
          } else if ([server.lowercaseString containsString:@"samsung"]) {
            platform = @"samsung-tizen";
          }

          char ipStr[INET_ADDRSTRLEN];
          inet_ntop(AF_INET, &fromAddr.sin_addr, ipStr, sizeof(ipStr));
          NSString *ipAddress = [NSString stringWithUTF8String:ipStr];

          [self sendEventWithName:@"onDeviceDiscovered" body:@{
            @"ipAddress": ipAddress,
            @"name": usn,
            @"platform": platform,
            @"server": server,
            @"location": location,
            @"usn": usn,
            @"method": @"ssdp"
          }];
        }
      }
    }

    close(sock);
    [self sendEventWithName:@"onDiscoveryComplete" body:@{
      @"method": @"ssdp",
      @"count": @(seenDevices.count)
    }];
    resolve(@{@"count": @(seenDevices.count)});
  });
}

#pragma mark - mDNS Discovery

RCT_EXPORT_METHOD(startMDNSScan:(NSString *)serviceType
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    // iOS 14+ NWBrowser approach for mDNS/DNS-SD
    if (@available(iOS 14.0, *)) {
      NSString *type = serviceType ?: @"_googlecast._tcp";
      NWBrowserDescriptor *descriptor = [[NWBrowserDescriptor alloc]
        initWithBonjourType:type domain:@"local."];

      NWParameters *params = [[NWParameters alloc] init];
      params.includePeerToPeer = YES;

      NWBrowser *browser = [[NWBrowser alloc] initWithDescriptor:descriptor
                                                      parameters:params];

      [browser setBrowseResultsChangedHandler:^(NSSet<NWBrowserResult *> *results, NSSet<NWBrowserResult *> *changes) {
        for (NWBrowserResult *result in results) {
          NSString *endpointStr = result.endpoint.debugDescription;
          NSString *name = result.endpoint.name ?: @"Unknown";

          [self sendEventWithName:@"onDeviceDiscovered" body:@{
            @"name": name,
            @"serviceType": type,
            @"endpoint": endpointStr,
            @"method": @"mdns"
          }];
        }
      }];

      [browser setStateChangedHandler:^(NWBrowserState state, NSError *error) {
        if (state == NWBrowserStateReady) {
          resolve(@"mDNS scan started");
        } else if (state == NWBrowserStateFailed) {
          [self sendEventWithName:@"onDiscoveryError" body:@{
            @"method": @"mdns",
            @"error": error.localizedDescription ?: @"Unknown error"
          }];
          resolve(@"mDNS scan completed with errors");
        }
      }];

      [browser start];
    } else {
      reject(@"ERR_IOS_VER", @"mDNS discovery requires iOS 14+", nil);
    }
  });
}

#pragma mark - Stop Discovery

RCT_EXPORT_METHOD(stopDiscovery:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // Clear all active connections and listeners
  for (NWConnection *conn in self.activeConnections) {
    [conn cancel];
  }
  [self.activeConnections removeAllObjects];
  [self.activeListeners removeAllObjects];
  resolve(@"Discovery stopped");
}

#pragma mark - Device Probe

RCT_EXPORT_METHOD(probeDevice:(NSString *)ipAddress
                  port:(nonnull NSNumber *)port
                  platform:(NSString *)platform
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *urlStr = [NSString stringWithFormat:@"http://%@:%@/", ipAddress, port];
  NSURL *url = [NSURL URLWithString:urlStr];

  NSURLSessionConfiguration *config = [NSURLSessionConfiguration ephemeralSessionConfiguration];
  config.timeoutIntervalForRequest = 3.0;
  config.timeoutIntervalForResource = 5.0;
  config.allowsCellularAccess = NO;

  NSURLSession *session = [NSURLSession sessionWithConfiguration:config];
  NSURLSessionDataTask *task = [session dataTaskWithURL:url
    completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
      if (error) {
        resolve(@{@"reachable": @NO, @"error": error.localizedDescription});
        return;
      }

      NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
      resolve(@{
        @"reachable": @YES,
        @"statusCode": @(httpResponse.statusCode),
        @"platform": platform ?: @"unknown"
      });
    }];
  [task resume];
}

#pragma mark - Local IP Address

RCT_EXPORT_METHOD(getLocalIPAddress:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  struct ifaddrs *interfaces = NULL;
  struct ifaddrs *temp_addr = NULL;

  if (getifaddrs(&interfaces) == 0) {
    temp_addr = interfaces;
    while (temp_addr != NULL) {
      if (temp_addr->ifa_addr->sa_family == AF_INET) {
        NSString *name = [NSString stringWithUTF8String:temp_addr->ifa_name];
        if ([name isEqualToString:@"en0"]) { // Wi-Fi interface
          char ipStr[INET_ADDRSTRLEN];
          inet_ntop(AF_INET,
            &((struct sockaddr_in *)temp_addr->ifa_addr)->sin_addr,
            ipStr, sizeof(ipStr));
          freeifaddrs(interfaces);
          resolve(@{@"ipAddress": [NSString stringWithUTF8String:ipStr], @"interface": name});
          return;
        }
      }
      temp_addr = temp_addr->ifa_next;
    }
    freeifaddrs(interfaces);
  }

  reject(@"ERR_NO_IP", @"Could not determine local IP address (Wi-Fi required)", nil);
}

#pragma mark - Wake-on-LAN

RCT_EXPORT_METHOD(sendWakeOnLAN:(NSString *)macAddress
                  ipAddress:(NSString *)ipAddress
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // Parse MAC address
  NSString *cleanMac = [[macAddress stringByReplacingOccurrencesOfString:@":" withString:@""]
    stringByReplacingOccurrencesOfString:@"-" withString:@""];

  if (cleanMac.length != 12) {
    reject(@"ERR_MAC", @"Invalid MAC address format", nil);
    return;
  }

  // Build magic packet: 6 bytes of 0xFF followed by MAC repeated 16 times
  NSMutableData *packet = [NSMutableData new];
  unsigned char sync[6] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
  [packet appendBytes:sync length:6];

  unsigned char mac[6];
  for (int i = 0; i < 6; i++) {
    NSString *byteStr = [cleanMac substringWithRange:NSMakeRange(i * 2, 2)];
    mac[i] = (unsigned char)strtol([byteStr UTF8String], NULL, 16);
  }

  for (int i = 0; i < 16; i++) {
    [packet appendBytes:mac length:6];
  }

  // Send via UDP to broadcast or specific IP
  int sock = socket(AF_INET, SOCK_DGRAM, 0);
  if (sock < 0) {
    reject(@"ERR_SOCKET", @"Failed to create socket", nil);
    return;
  }

  int broadcast = 1;
  setsockopt(sock, SOL_SOCKET, SO_BROADCAST, &broadcast, sizeof(broadcast));

  struct sockaddr_in addr;
  memset(&addr, 0, sizeof(addr));
  addr.sin_family = AF_INET;
  addr.sin_port = htons(9);
  addr.sin_addr.s_addr = ipAddress ?
    inet_addr([ipAddress UTF8String]) :
    inet_addr("255.255.255.255");

  ssize_t sent = sendto(sock, [packet bytes], [packet length], 0,
                        (struct sockaddr *)&addr, sizeof(addr));
  close(sock);

  if (sent > 0) {
    resolve(@{@"success": @YES, @"bytesSent": @(sent)});
  } else {
    reject(@"ERR_SEND", @"Failed to send Wake-on-LAN packet", nil);
  }
}

@end
