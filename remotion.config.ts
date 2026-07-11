// Remotion validates package parity against this exact Zod release at startup.
// Keep it as an explicit runtime dependency of the render entry so `knip` also
// sees the relationship that Remotion otherwise resolves internally.
import "zod";
import { Config } from "@remotion/cli/config";

Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(94);
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
