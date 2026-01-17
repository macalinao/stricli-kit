#!/usr/bin/env bun
import { run } from "@stricli/core";
import { app, context } from "../generated/app.js";

await run(app, process.argv.slice(2), context);
