#!/usr/bin/env node

var fmc = require("./FormCore.js");
var fmc_to_js = require("./FmcToJs.js");
var fs = require("fs");

if (process.argv[2] === "--help" || process.argv[2] === "-h") {
  console.log("# FormCore");
  console.log("");
  console.log("Type-checking:");
  console.log("");
  console.log("  fmc <file>");
  console.log("");
  console.log("Compiling to JavaScript:");
  console.log("");
  console.log("  fmc <file> <term> --js [--module] [--profile] [--expression] [--run]");
  console.log("");
  console.log("  --expression : generates an expression (inline module)");
  console.log("  --module     : generates a file that can be imported");
  console.log("  --profile    : generates a file that will profile itself");
  console.log("  --run        : runs the generated file");
  console.log("");
  console.log("Examples:");
  console.log("");
  console.log("  # Check all types on 'example.fmc':");
  console.log("  fmc example.fmc");
  console.log("");
  console.log("  # Compile 'main' on 'example.fmc' to 'example.js' and run:");
  console.log("  fmc example.fmc --js main >> example.js");
  console.log("  node example.js");
  console.log("");
  console.log("  # Runs 'main' on 'example.fmc':");
  console.log("  fmc example.fmc --js main -- run");
  console.log("");
  console.log("If you omit <file>, fmc will read from stdin.");
  process.exit();
}

(async () => {
  var file = process.argv[2] || "";
  try {
    if (file.slice(-4) === ".fmc") {
      var code = fs.readFileSync(file, "utf8");
      var args = [].slice.call(process.argv, 3);
    } else {
      var code = fs.readFileSync(0, "utf8");
      var args = [].slice.call(process.argv, 2);
    }
  } catch (e) {
    console.log(e);
    process.exit();
  }

  function get_opt(name) {
    for (var i = 0; i < args.length; ++i) {
      if (args[i] === name) {
        return args[i+1] || null;
      }
    }
    return null;
  };

  function has_opt(name) {
    return args.indexOf(name) !== -1;
  };

  if (has_opt("--js")) {
    var name = get_opt("--js");
    var opts = {
      profile: !!has_opt("--profile"),
      module: !!has_opt("--module"),
      expression: !!has_opt("--expression"),
    };
    try {
      var js_code = fmc_to_js.compile(code, name, opts);
    } catch (e) {
      console.log(e);
      process.exit();
    }
    if (has_opt("--run")) {
      eval(js_code);
    } else {
      console.log(js_code);
    }
  } else {
    fmc.report(code);
  }
})();
