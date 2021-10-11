// Term
// ====

const Var = (name,indx)                => ({ctor:"Var",name,indx});
const Ref = (name)                     => ({ctor:"Ref",name});
const Typ = ()                         => ({ctor:"Typ"});
const All = (eras,self,name,bind,body) => ({ctor:"All",eras,self,name,bind,body});
const Lam = (name,body)                => ({ctor:"Lam",name,body});
const App = (func,argm)                => ({ctor:"App",func,argm});
const Let = (name,expr,body)           => ({ctor:"Let",name,expr,body});
const Def = (name,expr,body)           => ({ctor:"Def",name,expr,body});
const Ann = (done,expr,type)           => ({ctor:"Ann",done,expr,type});
const Nat = (natx)                     => ({ctor:"Nat",natx});
const Chr = (chrx)                     => ({ctor:"Chr",chrx});
const Str = (strx)                     => ({ctor:"Str",strx});

// List
// ====

const Nil = ()          => ({ctor:"Nil",size:0});
const Ext = (head,tail) => ({ctor:"Ext",head,tail,size:tail.size+1});

// Finds first value satisfying `cond` in a list
function list_find(list, cond, indx = 0, skip = 0) {
  switch (list.ctor) {
    case "Nil":
      return null;
    case "Ext":
      if (cond(list.head, indx)) {
        if (skip === 0) {
          return {value:list.head, index:indx};
        } else {
          return list_find(list.tail, cond, indx + 1, skip - 1);
        }
      } else {
        return list_find(list.tail, cond, indx + 1, skip);
      };
  };
};

// Syntax
// ======

function show_string(str) {
  var out = ""
  for (var i = 0; i < str.length; i++) {
    if (str[i] == '\\' || str[i] == '"' || str[i] == "'") {
      out += '\\' + str[i];
    } else if (str[i] >= ' ' && str[i] <= `~`) {
      out += str[i];
    } else {
      out += "\\u{" + str.codePointAt(i).toString(16) + "}";
    }
  }
  return out;
}

function show(term, depth = 0) {
  switch (term.ctor) {
    case "Var":
      return term.name;
    case "Ref":
      return term.name;
    case "Typ":
      return "*";
    case "All":
      var bind = term.eras ? "%" : "@";
      var self = term.self;
      var name = term.name;
      var type = show(term.bind, depth);
      var body = show(term.body(Var(self,0), Var(name,0)), depth + 2);
      return bind + self + "(" + name + ":" + type + ") " + body;
    case "Lam":
      var bind = "#";
      var name = term.name;
      var body = show(term.body(Var(name,0)), depth + 1);
      return bind + name + " " + body;
    case "App":
      var open = "(";
      var func = show(term.func, depth);
      var argm = show(term.argm, depth);
      var clos = ")";
      return open + func + " " + argm + clos;
    case "Let":
      var name = term.name;
      var expr = show(term.expr, depth);
      var body = show(term.body(Var(name,0)), depth + 1);
      return "!" + name + "=" + expr + ";" + body;
    case "Def":
      var name = term.name;
      var expr = show(term.expr, depth);
      var body = show(term.body(Var(name,0)), depth + 1);
      return "$" + name + "=" + expr + ";" + body;
    case "Ann":
      var expr = show(term.expr, depth);
      //var type = show(term.type, depth);
      //return "{" + expr + ":" + type + "}";
      return expr;
    case "Nat":
      return ""+term.natx;
    case "Chr":
      return "'"+show_string(term.chrx)+"'"; 
    case "Str":
      return '"'+show_string(term.strx)+'"';
  };
};

function show_defs(defs) {
  var str = "";
  for (var name in defs) {
    str += name+": "+show(defs[name].type)+" = "+show(defs[name].term)+";\n";
  }
  return str;
};

function show_context(ctx, text = "") {
  switch (ctx.ctor) {
    case "Ext":
      var name = ctx.head.name;
      var type = show(ctx.head.type);
      if (name.length > 0) {
        var text = "- " + name + ": \x1b[2m" + type + "\x1b[0m\n" + text;
      }
      return show_context(ctx.tail, text);
    case "Nil":
      return text;
  };
};

function show_error(err, def_name) {
  if (err && err.ctor === "Err") {
    var index = 0;
    var str = "";
    str += def_name ? "\x1b[1mError on '"+def_name+"':\x1b[0m\n" : "";
    str += err.msg+"\n";
    str += "Expression: \x1b[2m" + show(err.term) + "\x1b[0m\n";
    if (err.ctx.ctor !== "Nil") {
      str += "Context:\n";
      str += show_context(err.ctx);
    };
    return str;
  } else {
    console.log("Internal error.");
    process.exit();
  }
};

function parse_defs(code, indx = 0, mode = "defs") {
  function is_name(chr) {
    var val = chr.charCodeAt(0);
    return (val >= 46 && val <= 47)  // ./
        || (val >= 48 && val < 58)   // 0-9
        || (val >= 65 && val < 91)   // A-Z
        || (val >= 95 && val < 96)   // _
        || (val >= 97 && val < 123); // a-z
  };
  function parse_name() {
    if (indx < code.length && is_name(code[indx])) {
      return code[indx++] + parse_name();
    } else {
      return "";
    }
  };
  function parse_spaces() {
    while (" \n\r\t\v\f".indexOf(code[indx]) !== -1) {
      ++indx;
    };
  };
  function parse_tokn() {
    if (indx >= code.length) {
      throw "Unexpected eof";
    } else if (code[indx] == '\\') {
      var esc = code[++indx];
      switch (esc) {
        case 'u':
          indx++;
          var skip = parse_char('{');
          var point = ""
          while (code[indx] !== '}') {
            if ("0123456789abcdefABCDEF".indexOf(code[indx]) !== -1) {
              point += code[indx++];
            } else {
              throw 'Expected hexadecimal Unicode codepoint", found '+
                JSON.stringify(code[indx])+' at '+indx+': '+JSON.stringify(code.slice(indx,indx+32))+".";
            }
          }
          indx++;
          return String.fromCodePoint(parseInt(point,16));
        case '\\':
        case '"':
        case "'":
          indx++;
          return esc;
        default:
         throw "Unexpected escape char: '\\" + code[indx+1] + "'.";
      }
    } else {
      return code[indx++];
    }
  }
  function parse_char(chr) {
    parse_spaces();
    if (indx >= code.length) {
      throw "Unexpected eof.";
    } else if (code[indx] !== chr) {
      throw 'Expected "'+chr+'", found '+JSON.stringify(code[indx])+' at '+indx+': '+JSON.stringify(code.slice(indx,indx+32))+".";
    }
    ++indx;
  };
  function parse_term() {
    parse_spaces();
    var chr = code[indx++];
    switch (chr) {
      case "*":
        return ctx => Typ();
      case "@":
      case "%":
        var eras = chr === "%";
        var self = parse_name();
        var skip = parse_char("(");
        var name = parse_name();
        var skip = parse_char(":");
        var bind = parse_term();
        var skip = parse_char(")");
        var body = parse_term();
        return ctx => All(eras, self, name, bind(ctx), (s,x) => body(Ext([name,x],Ext([self,s],ctx))));
      case "#":
        var name = parse_name();
        var body = parse_term();
        return ctx => Lam(name, (x) => body(Ext([name,x],ctx)));
      case "(":
        var func = parse_term();
        var argm = parse_term();
        var skip = parse_char(")");
        return ctx => App(func(ctx), argm(ctx));
      case "!":
        var name = parse_name();
        var skip = parse_char("=");
        var expr = parse_term();
        var skip = parse_char(";");
        var body = parse_term();
        return ctx => Let(name, expr(ctx), x => body(Ext([name,x],ctx)));
      case "$":
        var name = parse_name();
        var skip = parse_char("=");
        var expr = parse_term();
        var skip = parse_char(";");
        var body = parse_term();
        return ctx => Def(name, expr(ctx), x => body(Ext([name,x],ctx)));
      case "{":
        var expr = parse_term();
        var skip = parse_char(":");
        var type = parse_term();
        var skip = parse_char("}");
        return ctx => Ann(false, expr(ctx), type(ctx));
      case "'":
        var chrx = parse_tokn();
        var skip = parse_char("'");
        return ctx => Chr(chrx);
      case '"':
        var strx = "";
        while (code[indx] !== '"') {
          strx += parse_tokn();
        }
        var skip = parse_char('"');
        return ctx => Str(strx);
      case '+':
        var numb = chr + parse_name();
        return ctx => Nat(BigInt(numb));
      default:
        if (is_name(chr)) {
          var name = chr + parse_name();
          if (code[indx] === "^") {
            indx++;
            var brui = Number(parse_name());
          } else {
            var brui = 0;
          }
          return ctx => {
            var got = list_find(ctx, (x) => x[0] === name, 0, brui);
            if (got) {
              return got.value[1];
            } else {
              return Ref(name);
            }
          };
        } else {
          throw "Unexpected symbol: '" + chr + "'.";
        }
    };
  };
  function parse_defs() {
    parse_spaces();
    var name = parse_name();
    if (name.length > 0) {
      var skip = parse_char(":");
      var type = parse_term()(Nil());
      var skip = parse_char("=");
      var term = parse_term()(Nil());
      var skip = parse_char(";");
      defs[name] = {type, term};
      parse_defs();
    }
  };
  code = code.split("\n").filter(x => x.slice(0,2) !== "//").join("\n");
  var indx = 0;
  if (mode === "defs") {
    var defs = {};
    parse_defs();
    return defs;
  } else {
    return parse_term()(Nil());
  };
};

function parse(code) {
  return parse_defs(code, 0, "term");
};

// Evaluation
// ==========

function unroll_nat(term) {
  if (term.natx === 0n) {
    return Ref("Nat.zero");
  } else {
    return App(Ref("Nat.succ"), Nat(term.natx - 1n));
  };
};

function unroll_chr(term) {
  var done = Ref("Char.new");
  var ccod = term.chrx.charCodeAt(0);
  for (var i = 0; i < 16; ++i) {
    done = App(done, Ref(((ccod>>>(16-i-1))&1) ? "Bit.1" : "Bit.0"));
  };
  return done;
};

function unroll_str(term) {
  if (term.strx.length === 0) {
    return Ref("String.nil");
  } else {
    var chr = unroll_chr(Chr(term.strx[0]));
    return App(App(Ref("String.cons"), chr), Str(term.strx.slice(1)));
  }
};

function reduce(term, defs = {}) {
  switch (term.ctor) {
    case "Var":
      return Var(term.name, term.indx);
    case "Ref":
      var got = defs[term.name];
      if (got) {
        return reduce(got.term, defs);
      } else {
        return Ref(term.name);
      }
    case "Typ":
      return Typ();
    case "All":
      var eras = term.eras;
      var self = term.self;
      var name = term.name;
      var bind = term.bind;
      var body = term.body;
      return All(eras, self, name, bind, body);
    case "Lam":
      var name = term.name;
      var body = term.body;
      return Lam(name, body);
    case "App":
      var func = reduce(term.func, defs);
      switch (func.ctor) {
        case "Lam":
          return reduce(func.body(term.argm), defs);
        default:
          return App(func, term.argm);
      };
    case "Let":
      var name = term.name;
      var expr = term.expr;
      var body = term.body;
      return reduce(body(expr), defs);
    case "Def":
      var name = term.name;
      var expr = term.expr;
      var body = term.body;
      return reduce(body(expr), defs);
    case "Ann":
      return reduce(term.expr, defs);
    case "Nat":
      return reduce(unroll_nat(term), defs);
    case "Chr":
      return reduce(unroll_chr(term), defs);
    case "Str":
      return reduce(unroll_str(term), defs);
  };
};

function normalize(term, defs) {
  var norm = reduce(term, defs);
  switch (norm.ctor) {
    case "Var":
      return Var(norm.name, norm.indx);
    case "Ref":
      return Ref(norm.name);
    case "Typ":
      return Typ();
    case "All":
      var eras = norm.eras;
      var self = norm.self;
      var name = norm.name;
      var bind = normalize(norm.bind, defs);
      var body = (s,x) => normalize(norm.body(s,x), defs);
      return All(eras, self, name, bind, body);
    case "Lam":
      var name = norm.name;
      var body = x => normalize(norm.body(x), defs);
      return Lam(name, body);
    case "App":
      var func = normalize(norm.func, defs);
      var argm = normalize(norm.argm, defs);
      return App(func, argm);
    case "Let":
      return normalize(norm.body(norm.expr), defs);
    case "Def":
      return normalize(norm.body(norm.expr), defs);
    case "Ann":
      return normalize(norm.expr, defs);
    case "Nat":
      return Nat(term.natx);
    case "Chr":
      return Chr(term.chrx);
    case "Str":
      return Str(term.strx);
  };
};

// Equality
// ========

// Serializes a term to a string that identifies it uniquely.
function serialize(term, dep = 0, ini = 0) {
  switch (term.ctor) {
    case "Var":
      var lvl = term.indx;
      if (lvl >= ini) {
        return "^-" + (dep - lvl - 1);
      } else {
        return "^+" + lvl;
      }
    case "Ref":
      return "$" + term.name;
    case "Typ":
      return "*";
    case "All":
      var init = term.eras ? "%" : "@";
      var self = term.self;
      var bind = serialize(term.bind, dep, ini);
      var body = serialize(term.body(Var("", dep), Var("", dep+1)), dep+2, ini);
      return init + self + bind + body;
    case "Lam":
      var body = serialize(term.body(Var("", dep)), dep+1, ini);
      return "#" + body;
    case "App":
      var func = serialize(term.func, dep, ini);
      var argm = serialize(term.argm, dep, ini);
      return "(" + func + " " + argm + ")";
    case "Let":
      var expr = serialize(term.expr, dep, ini);
      var body = serialize(term.body(Var("", dep)), dep+1, ini);
      return "!" + expr + body;
    case "Def":
      var expr = serialize(term.expr, dep, ini);
      var body = serialize(term.body(Var("", dep)), dep+1, ini);
      return "$" + expr + body;
    case "Ann":
      var expr = serialize(term.expr, dep, ini);
      return expr;
    case "Nat":
      return "+"+term.natx;
    case "Chr":
      return "'"+term.chrx+"'";
    case "Str":
      return '"'+term.strx+'"';
  }
};

// Are two terms equal?
function equal(a, b, defs, dep = 0, seen = {}) {
  let a1 = reduce(a, defs);
  let b1 = reduce(b, defs);
  var ah = serialize(a1, dep, dep);
  var bh = serialize(b1, dep, dep);
  var id = ah + "==" + bh;
  if (ah === bh || seen[id]) {
    return true;
  } else {
    seen[id] = true;
    switch (a1.ctor + b1.ctor) {
      case "AllAll":
        var a1_body = a1.body(Var(a1.self, dep), Var(a1.name, dep+1));
        var b1_body = b1.body(Var(a1.self, dep), Var(a1.name, dep+1));
        return a1.eras === b1.eras
            && a1.self === b1.self
            && equal(a1.bind, b1.bind, defs, dep+0, seen)
            && equal(a1_body, b1_body, defs, dep+2, seen);
      case "LamLam":
        var a1_body = a1.body(Var(a1.name, dep));
        var b1_body = b1.body(Var(a1.name, dep));
        return equal(a1_body, b1_body, defs, dep+1, seen);
      case "AppApp":
        return equal(a1.func, b1.func, defs, dep, seen)
            && equal(a1.argm, b1.argm, defs, dep, seen);
      case "LetLet":
        var a1_body = a1.body(Var(a1.name, dep));
        var b1_body = b1.body(Var(a1.name, dep));
        return equal(a1.expr, b1.expr, defs, dep+0, seen)
            && equal(a1_body, b1_body, defs, dep+1, seen);
      case "AnnAnn":
        return equal(a1.expr, b1.expr, defs, dep, seen);
      default:
        return false;
    }
  };
};

// Type-Checking
// =============

function Err(term, ctx, msg) {
  return {
    ctor: "Err",
    term,
    ctx,
    msg,
  };
};

function error(term, ctx, msg) {
  throw Err(term, ctx, msg);
};

function typeinfer(term, defs, ctx = Nil()) {
  switch (term.ctor) {
    case "Var":
      return Var(term.name, term.indx);
    case "Ref":
      var got = defs[term.name];
      if (got) {
        return got.type;
      } else {
        error(term, ctx, "Unbound reference: '"+term.name+"'.");
      }
    case "Typ":
      return Typ();
    case "App":
      var func_typ = reduce(typeinfer(term.func, defs, ctx), defs);
      switch (func_typ.ctor) {
        case "All":
          var self_var = Ann(true, term.func, func_typ);
          var name_var = Ann(true, term.argm, func_typ.bind);
          typecheck(term.argm, func_typ.bind, defs, ctx);
          var term_typ = func_typ.body(self_var, name_var);
          return term_typ;
        default:
          error(term, ctx, "Non-function application.");
      };
    case "Let":
      var expr_typ = typeinfer(term.expr, defs, ctx);
      var expr_var = Ann(true, Var(term.name, ctx.size+1), expr_typ);
      var body_ctx = Ext({name:term.name,type:expr_var.type}, ctx);
      var body_typ = typeinfer(term.body(expr_var), defs, body_ctx);
      return body_typ;
    case "Def":
      return typeinfer(term.body(term.expr), defs, ctx);;
    case "All":
      var self_var = Ann(true, Var(term.self, ctx.size), term);
      var name_var = Ann(true, Var(term.name, ctx.size+1), term.bind);
      var body_ctx = Ext({name:term.self,type:self_var.type}, ctx);
      var body_ctx = Ext({name:term.name,type:name_var.type}, body_ctx);
      typecheck(term.bind, Typ(), defs, ctx);
      typecheck(term.body(self_var,name_var), Typ(), defs, body_ctx);
      return Typ();
    case "Ann":
      if (!term.done) {
        typecheck(term.expr, term.type, defs, ctx);
      }
      return term.type;
    case "Nat":
      return Ref("Nat");
    case "Chr":
      return Ref("Char");
    case "Str":
      return Ref("String");
  }
  error(term, ctx, "Can't infer.");
};

function typecheck(term, type, defs, ctx = Nil()) {
  var typv = reduce(type, defs);
  switch (term.ctor) {
    case "Lam":
      if (typv.ctor === "All") {
        var self_var = Ann(true, term, type);
        var name_var = Ann(true, Var(term.name, ctx.size+1), typv.bind);
        var body_typ = typv.body(self_var, name_var);
        var body_ctx = Ext({name:term.name,type:name_var.type}, ctx);
        typecheck(term.body(name_var), body_typ, defs, body_ctx);
      } else {
        error(term, ctx, "Lambda has a non-function type.");
      }
      break;
    case "Let":
      var expr_typ = typeinfer(term.expr, defs, ctx);
      var expr_var = Ann(true, Var(term.name, ctx.size+1), expr_typ);
      var body_ctx = Ext({name:term.name,type:expr_var.type}, ctx);
      typecheck(term.body(expr_var), type, defs, body_ctx);
      break;
    default:
      var infr = typeinfer(term, defs, ctx);
      var eq = equal(type, infr, defs, ctx.size);
      if (!eq) {
        var type0_str = show(normalize(type, {}), ctx);
        var infr0_str = show(normalize(infr, {}), ctx);
        error(term, ctx, 
          "Found type: \x1b[2m"+infr0_str+"\x1b[0m\n" +
          "Instead of: \x1b[2m"+type0_str+"\x1b[0m");
      }
      break;
  };
  return {term,type};
};

function report(code) {
  try {
    var defs = parse_defs(code);
  } catch (err) {
    console.log(err);
    return;
  }
  var wrong = false;
  for (var name in defs) {
    try {
      typecheck(defs[name].type, Typ(), defs, Nil());
      typecheck(defs[name].term, defs[name].type, defs, Nil());
    } catch (err) {
      wrong = true;
      console.log(show_error(err, name));
    }
  };
  if (!wrong) {
    console.log("All terms check.");
  }
};

module.exports = {
  Var, Ref, Typ, All,
  Lam, App, Let, Def,
  Ann, Nat, Chr, Str,
  Nil, Ext, Err,
  list_find,
  show_string,
  show,
  show_defs,
  show_context,
  show_error,
  parse,
  parse_defs,
  unroll_nat,
  unroll_chr,
  unroll_str,
  reduce,
  normalize,
  serialize,
  equal,
  typeinfer,
  typecheck,
  report,
};
