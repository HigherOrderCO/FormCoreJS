//type IO <A: Type> {
  //// Returns a pure result
  //done(value: A)

  //// Prints a line to the console
  //do_print(text: String, then: Unit -> IO<A>)

  //// Gets a line from the console
  //do_prompt(then: String -> IO<A>)

  //// Writes a file
  //do_write_file(path: String, file: String, then: Bool -> IO<A>)

  //// Reads a file
  //do_read_file(path: String, then: Maybe<String> -> IO<A>)

  //// Deletes a file
  //do_remove_file(path: String, then: Bool -> IO<A>)

  //// Gets all files in a directory
  //do_read_directory(path: String, then: Maybe<List<String>> -> IO<A>)

  //// Gets the write time of a file
  //do_get_file_modified_time(path: String, then: Maybe<Nat> -> IO<A>)

  //// Fetches a URL
  //do_fetch(url: String, options: Map<String>, headers: Map<String>, then: Maybe<String> -> IO<A>)

  //// Returns the current time, in milliseconds since epoch
  //do_get_time(then: Nat -> IO<A>)

  //// Returns the program argument list
  //do_get_arguments(then: List<String> -> IO<A>)

  //// Starts listening to an UDP port
  //do_init_udp(port: Nat, then: Bool -> IO<A>)

  //// Stops listening to an UDP port
  //do_stop_udp(port: Nat, then: Bool -> IO<A>)

  //// Sends an UDP packet
  //do_send_udp(port: U16, to_address: String, to_port: U16, then: Bool -> IO<A>)

  //// Receives an incoming UDP message
  //do_read_udp(then: Maybe<IO.Net.Mail> -> IO<A>)

  //// Waits a given amount of time
  //do_sleep(time: Nat, then: Unit -> IO<A>)

  //// Spawns a thread
  //do_spawn(thread: IO<Unit>, then: Unit -> IO<A>)
//}

// IO.print
// --------

async function node_print(text) {
  console.log(text);
  return null;
}

async function deno_print(text) {
  console.log(text);
  return null;
}

async function web_print(text) {
  console.log(text[text.length - 1] === "\n" ? text.slice(0,-1) : text);
  return null;
}

// IO.prompt
// ---------

async function node_prompt(text) {
  return new Promise((res,err) => {
    var si = process.stdin;
    var so = process.stdout;
    var rl = require("readline").createInterface({input: si, output: so, terminal: false});
    rl.question(text+" ", (line) => {
      rl.close();
      res(line);
    });
  });
}

async function deno_prompt(text) {
  return prompt(text);
}

async function web_prompt(text) {
  return prompt(text);
}

// IO.do_write_file
// ----------------

async function node_write_file(path, file) {
  try {
    var fs = require("fs");
    fs.mkdirSync(path.split('/').slice(0,-1).join('/'),{recursive:true})
    fs.writeFileSync(path, file);
    return true;
  } catch (e) {
    return false;
  };
}

async function deno_write_file(path, file) {
  try {
    Deno.mkdirSync(path.split('/').slice(0,-1).join('/'),{recursive:true})
    Deno.writeTextFileSync(path, file);
    return true;
  } catch (e) {
    return false;
  }
}

async function web_write_file(path, file) {
  localStorage.setItem(path, file);
  localStorage.setItem(path+"$mtime", String(Date.now()));
  return true;
}

// IO.do_read_file
// ---------------

async function node_read_file(path) {
  try {
    var fs = require("fs");
    var file = fs.readFileSync(path, "utf8");
    return file;
  } catch (e) {
    return null;
  }
}

async function deno_read_file(path) {
  try {
    var file = Deno.readTextFileSync(path)
    return file;
  } catch (e) {
    return null;
  }
}

// Uses localStorage instead of files
async function web_read_file(path) {
  return localStorage.getItem(path) || null;
}

// IO.do_remove_file
// -----------------

async function node_remove_file(path) {
  var fs = require("fs");
  try {
    fs.unlinkSync(path);
    return true;
  } catch (e) {
    if (e.code === "EPERM") {
      try {
        fs.rmdirSync(path);
        return true;
      } catch (e) {
        return false;
      }
    } else {
      return false;
    }
  }
}

async function deno_remove_file(path) {
  try {
    Deno.removeSync(path);
    return true;
  } catch (e) {
    return false;
  }
}

// Uses localStorage instead of files
async function web_remove_file(path) {
  localStorage.removeItem(path);
  localStorage.removeItem(path+"$mtime");
  return true;
}

// IO.do_read_directory
// --------------------

async function node_read_directory(path) {
  var fs = require("fs");
  try {
    var dir = fs.readdirSync(path);
    return dir;
  } catch (e) {
    return null;
  }
}

async function deno_read_directory(path) {
  try {
    var dir = Deno.readDirSync(path);
    return Array.from(dir).map(x => x.name);
  } catch (e) {
    return null;
  }
}

async function web_read_directory(path) {
  var path = path[path.length - 1] === "/" ? path : path + "/";
  var all = Object.keys(localStorage);
  var dir = {};
  for (var key of all) {
    if (key.slice(0, path.length) === path) {
      dir[key.slice(path.length).replace(/\/.*/,"")] = 1;
    }
  }
  return Object.keys(dir);
}

// IO.do_get_file_modified_time
// ----------------------------

async function node_get_file_modified_time(path) {
  var fs = require("fs");
  try {
    var stats = fs.statSync(path);
    return stats.mtime.getTime();
  } catch (e) {
    return null;
  }
}

async function deno_get_file_modified_time(path) {
  try {
    var stats = Deno.statSync(path);
    return stats.mtime.getTime();
  } catch (e) {
    return null;
  }
}

async function web_get_file_modified_time(path) {
  return Number(localStorage.getItem(path)) || null;
}

// IO.do_fetch
// -----------

async function node_fetch(url, options = {}, headers = {}) {
  return new Promise((res,err) => {
    var http = /^https/.test(url) ? require("https") : require("http");
    if (options.body) {
      headers["Accept"] = "*/*";
      headers["Accept-Encoding"] = "gzip, br";
      headers["Content-Type"] = "text/plain;charset=UTF-8";
      headers["Content-Length"] = String(Buffer.byteLength(options.body));
    }
    var req = http.request(url, {...options, headers}, (r) => {
      var data = "";
      r.on("data", chunk => data += chunk);
      r.on("end", () => res(data));
    });
    req.on("error", () => res(null));
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function deno_fetch(url, options, headers) {
  try {
    var response = await fetch(url, {...options, headers});
    return response.text();
  } catch (e) {
    return null;
  }
}

async function web_fetch(url, options, headers) {
  try {
    var response = await fetch(url, {...options, headers});
    return response.text();
  } catch (e) {
    return null;
  }
}

// IO.do_get_time
// --------------

async function node_get_time() {
  return Date.now();
}

async function deno_get_time() {
  return Date.now();
}

async function web_get_time() {
  return Date.now();
}

// IO.do_get_arguments
// -------------------

async function node_get_arguments() {
  return process.argv.slice(2);
}

async function deno_get_arguments() {
  return Deno.args;
}

async function web_get_arguments() {
  return window.location.search.slice(1).split("&").map(x => x.split("="));
}

// IO.do_init_udp
// --------------

var $UDP_SOCKET = {};
var $UDP_INBOX = {};

// Uses the "dgram" UDP module from Node.js
async function node_init_udp(port) {
  return new Promise((res,err) => {
    var dgram = require("dgram");
    $UDP_SOCKET[port] = dgram.createSocket("udp4");
    $UDP_SOCKET[port].on("listening", () => {
      $UDP_INBOX[port] = [];
      res(true);
      res = () => {};
    });
    $UDP_SOCKET[port].on("message", (msg,info) => {
      $UDP_INBOX[port].push([new Uint8Array(msg), info.address, info.port]);
    });
    $UDP_SOCKET[port].on("error", (err) => {
      res(false);
      delete $UDP_SOCKET[port];
      delete $UDP_INBOX[port];
      res = () => {};
    });
    $UDP_SOCKET[port].bind(port);
  });
}

async function deno_init_udp(port) {
  try {
    $UDP_SOCKET[port] = Deno.listenDatagram({port: port, transport: "udp"});
    setTimeout(async () => {
      try {
        for await (const [buff, info] of $UDP_SOCKET[port]) {
          $UDP_INBOX[port].push([buff, info.hostname, info.port]);
        }
      } catch (e) {}
    }, 0);
    $UDP_INBOX[port] = [];
    return true;
  } catch (e) {
    delete $UDP_SOCKET[port];
    delete $UDP_INBOX[port];
    return false;
  }
}

async function web_init_udp(port) {
  return false;
}

// IO.do_stop_udp
// --------------

// Uses the "dgram" UDP module from Node.js
async function node_stop_udp(port) {
  if ($UDP_SOCKET[port]) {
    $UDP_SOCKET[port].close();
    delete $UDP_SOCKET[port];
    delete $UDP_INBOX[port];
    return true;
  }
  return false;
}


async function deno_stop_udp(port) {
  if ($UDP_SOCKET[port]) {
    $UDP_SOCKET[port].close();
    delete $UDP_SOCKET[port];
    delete $UDP_INBOX[port];
    return true;
  }
  return false;
}

async function web_stop_udp(port) {
  return false;
}

// IO.do_send_udp
// --------------

async function node_send_udp(port, to_address, to_port, data) {
  if ($UDP_SOCKET[port]) {
    $UDP_SOCKET[port].send(data, 0, data.length, to_port, to_address);
    return true;
  }
  return false;
}

async function deno_send_udp(port, to_address, to_port, data) {
  if ($UDP_SOCKET[port]) {
    $UDP_SOCKET[port].send(data, {transport: "udp", hostname: to_address, port: to_port});
    return true;
  }
  return false;
}

// Sends the message to the proxy
async function web_send_udp(port, dest, data) {
  return false;
}

// IO.do_receive_udp
// -----------------

async function node_read_udp(port) {
  var got = $UDP_INBOX[port];
  if (got) {
    $UDP_INBOX[port] = [];
    return got;
  } else {
    return [];
  }
}

async function deno_read_udp(port) {
  var got = $UDP_INBOX[port];
  if (got) {
    $UDP_INBOX[port] = [];
    return got;
  } else {
    return [];
  }
}

async function web_read_udp(port) {
  return [];
}

// IO.do_sleep
// -----------

async function node_sleep(time) {
  return new Promise((res,err) => {
    setTimeout(() => {
      res(null);
    }, time);
  });
}

async function deno_sleep(time) {
  return new Promise((res,err) => {
    setTimeout(() => {
      res(null);
    }, time);
  });
}

async function web_sleep(time) {
  return new Promise((res,err) => {
    setTimeout(() => {
      res(null);
    }, time);
  });
}

// EXPORTS
// -------

var io = {
  node: {
    print: node_print,
    prompt: node_prompt,
    write_file: node_write_file,
    read_file: node_read_file,
    remove_file: node_remove_file,
    read_directory: node_read_directory,
    get_file_modified_time: node_get_file_modified_time,
    fetch: node_fetch,
    get_time: node_get_time,
    get_arguments: node_get_arguments,
    init_udp: node_init_udp,
    stop_udp: node_stop_udp,
    send_udp: node_send_udp,
    read_udp: node_read_udp,
    sleep: node_sleep,
  },
  deno: {
    print: deno_print,
    prompt: deno_prompt,
    write_file: deno_write_file,
    read_file: deno_read_file,
    remove_file: deno_remove_file,
    read_directory: deno_read_directory,
    get_file_modified_time: deno_get_file_modified_time,
    fetch: deno_fetch,
    get_time: deno_get_time,
    get_arguments: deno_get_arguments,
    init_udp: deno_init_udp,
    stop_udp: deno_stop_udp,
    send_udp: deno_send_udp,
    read_udp: deno_read_udp,
    sleep: deno_sleep,
  },
  web: {
    print: web_print,
    prompt: web_prompt,
    write_file: web_write_file,
    read_file: web_read_file,
    remove_file: web_remove_file,
    read_directory: web_read_directory,
    get_file_modified_time: web_get_file_modified_time,
    fetch: web_fetch,
    get_time: web_get_time,
    get_arguments: web_get_arguments,
    init_udp: web_init_udp,
    stop_udp: web_stop_udp,
    send_udp: web_send_udp,
    read_udp: web_read_udp,
    sleep: web_sleep,
  },
};

//(async () => {

//io = io.deno;

// PRINT
//await io.print("Bem-vindo.");

// PROMPT
//var nome = await io.prompt("Seu nome:");
//await io.print("ola, " + nome);

// FILES
//console.log(await io.write_file("./tmp/tmp.txt", "testando"));
//console.log(await io.get_file_modified_time("./tmp/tmp.txt"));
//console.log(await io.read_directory("./tmp"));
//console.log(await io.read_file("./tmp/tmp.txt"));
//console.log(await io.remove_file("./tmp")); // false
//console.log(await io.remove_file("./tmp/tmp.txt")); // true
//console.log(await io.remove_file("./tmp")); // true

// FETCH
//console.log(await io.fetch("http://httpbin.org/post?a=1&b=2", {method: "POST", body: 'testing!'}, {}));

// GET_TIME
//console.log(await io.get_time());

// GET_ARGUMENTS
//console.log(await io.get_arguments());

// UDP
//console.log(await io.init_udp(7171));
//console.log(await io.init_udp(7172));
//setTimeout(async () => {
  //console.log(await io.stop_udp(7171))
  //console.log(await io.stop_udp(7172))
//}, 1000);
//console.log(await io.send_udp(7171, "127.0.0.1", 7171, new Uint8Array([1,2])));
//console.log(await io.send_udp(7171, "127.0.0.1", 7172, new Uint8Array([3,4])));
//console.log(await io.send_udp(7171, "127.0.0.1", 7172, new Uint8Array([5,6])));
//setTimeout(async () => {
  //console.log(await io.read_udp(7171));
  //console.log(await io.read_udp(7172));
//}, 500);

//})();
