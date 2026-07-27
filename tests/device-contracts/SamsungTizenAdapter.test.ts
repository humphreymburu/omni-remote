import { SamsungTizenAdapter } from "@omni-remote/adapter-samsung-tizen";
import { describeAdapterContract } from "../../packages/core/adapter-contract";

describeAdapterContract("Samsung Tizen", () => new SamsungTizenAdapter("192.168.1.100"));
