import { LgWebOsAdapter } from "@omni-remote/adapter-lg-webos";
import { describeAdapterContract } from "../../packages/core/adapter-contract";

describeAdapterContract("LG webOS", () => new LgWebOsAdapter("192.168.1.100"));
