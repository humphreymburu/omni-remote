import { RokuAdapter } from "@omni-remote/adapter-roku";
import { describeAdapterContract } from "../../packages/core/adapter-contract";

describeAdapterContract("Roku", () => new RokuAdapter("192.168.1.100"));
