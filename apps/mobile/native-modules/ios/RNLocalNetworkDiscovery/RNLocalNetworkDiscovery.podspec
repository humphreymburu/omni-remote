require 'json'

package = JSON.parse(File.read(File.join(__dir__, '../../package.json')))

Pod::Spec.new do |s|
  s.name         = "RNLocalNetworkDiscovery"
  s.version      = package['version']
  s.summary      = "Native iOS local network discovery for Omni Remote"
  s.homepage     = "https://github.com/omni-remote/omni-remote"
  s.license      = "MIT"
  s.author       = "Omni Remote"
  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :path => '.' }

  s.source_files = "ios/OmniRemote/RNLocalNetworkDiscovery.{h,m}"

  s.frameworks   = "Network"

  s.dependency "React-Core"
end
