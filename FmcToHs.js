var fmc = require("./FormCore.js");

const Var = (name)           => ({ctor:"Var",name});
const Ref = (name)           => ({ctor:"Ref",name});
const Nul = ()               => ({ctor:"Nul"});
const Lam = (name,body)      => ({ctor:"Lam",name,body});
const App = (func,argm)      => ({ctor:"App",func,argm});
const Let = (name,expr,body) => ({ctor:"Let",name,expr,body});
const Eli = (prim,expr)      => ({ctor:"Eli",prim,expr});
const Ins = (prim,expr)      => ({ctor:"Ins",prim,expr});
const Chr = (chrx)           => ({ctor:"Chr",chrx});
const Str = (strx)           => ({ctor:"Str",strx});
const Nat = (natx)           => ({ctor:"Nat",natx});

var is_prim = {
  Unit     : 1,
  Bool     : 1,
  Nat      : 1,
  U16      : 1,
  String   : 1,
};

var prim_types = {
  Unit: {
    inst: [[0, "()"]],
    elim: {ctag: x => '()', ctor: [[]]},
    cnam: {mode: "one", nams: ['unit']},
  },
  Bool: {
    inst: [[0, "True"], [0, "False"]],
    elim: {ctag: x => x, ctor: [[], []]},
    cnam: {mode: "if"},
  },
  Nat: {
    inst: [[0, "0"], [1, p => "1+"+p]],
    elim: {
      ctag: x => x+"==0",
      ctor: [[], [x => "("+x+"-1)"]],
    },
    cnam: {mode: "if"},
  },
  U16: {
    inst: [[1, x => "(word_to_u16 "+x+")"]],
    elim: {
      ctag: x => "()",
      ctor: [[x => "(u16_to_word "+x+")"]],
    },
    cnam: {mode: "one"},
  },
  String: {
    inst: [[0,"[]"], [2, h => t => "((toEnum (fromIntegral "+h+" :: Int) :: Char) : "+t+")"]],
    elim: {
      ctag: x => "null ("+x+"::String)",
      ctor: [[], [x => "(fromIntegral (fromEnum (head "+x+" :: Char)) :: Word16)", x => "(tail "+x+")"]],
    },
    cnam: {mode: "if"},
  },
};

var prim_funcs = {
  "Bool.not"         : [1, a=>`(not ${a})`],
  "Bool.and"         : [2, a=>b=>`(${a} && ${b})`],
  "Bool.if"          : [3, a=>b=>c=>`(if ${a} then ${b} else ${c})`],
  "Bool.or"          : [2, a=>b=>`(${a} || ${b})`],
  "Debug.log"        : [2, a=>b=>`trace ${a} (${b} ())`],
  "Nat.add"          : [2, a=>b=>`((${a}::Integer) + ${b})`],
  "Nat.sub"          : [2, a=>b=>`((${a}::Integer) - ${b})`],
  "Nat.mul"          : [2, a=>b=>`((${a}::Integer) * ${b})`],
  "Nat.div"          : [2, a=>b=>`(div (${a}::Integer) ${b})`],
  "Nat.pow"          : [2, a=>b=>`((${a}::Integer) ^ ${b})`],
  "Nat.ltn"          : [2, a=>b=>`((${a}::Integer) < ${b})`],
  "Nat.lte"          : [2, a=>b=>`((${a}::Integer) <= ${b})`],
  "Nat.eql"          : [2, a=>b=>`((${a}::Integer) == ${b})`],
  "Nat.gte"          : [2, a=>b=>`((${a}::Integer) >= ${b})`],
  "Nat.gtn"          : [2, a=>b=>`((${a}::Integer) > ${b})`],
  "Nat.to_u16"       : [1, a=>`(fromIntegral (${a}::Integer))`],
  "U16.add"          : [2, a=>b=>`((${a}::Word16) + ${b})`],
  "U16.sub"          : [2, a=>b=>`((${a}::Word16) - ${b})`],
  "U16.mul"          : [2, a=>b=>`((${a}::Word16) * ${b})`],
  "U16.div"          : [2, a=>b=>`(div (${a}::Word16) ${b})`],
  "U16.mod"          : [2, a=>b=>`(mod (${a}::Word16) ${b})`],
  "U16.pow"          : [2, a=>b=>`((${a}::Word16) ^ ${b})`],
  "U16.ltn"          : [2, a=>b=>`((${a}::Word16) < ${b})`],
  "U16.lte"          : [2, a=>b=>`((${a}::Word16) <= ${b})`],
  "U16.eql"          : [2, a=>b=>`((${a}::Word16) == ${b})`],
  "U16.gte"          : [2, a=>b=>`((${a}::Word16) >= ${b})`],
  "U16.gtn"          : [2, a=>b=>`((${a}::Word16) > ${b})`],
  "U16.shr"          : [2, a=>b=>`(shiftR (${a}::Word16) (fromIntegral ${b}))`],
  "U16.shl"          : [2, a=>b=>`(shiftL (${a}::Word16) (fromIntegral ${b}))`],
  "U16.and"          : [2, a=>b=>`((${a}::Word16) .&. ${b})`],
  "U16.or"           : [2, a=>b=>`((${a}::Word16) .|. ${b})`],
  "U16.xor"          : [2, a=>b=>`(xor (${a}::Word16) ${b})`],
  "String.eql"       : [2, a=>b=>`((${a}::String) == ${b})`],
  "String.concat"    : [2, a=>b=>`((${a}::String) ++ ${b})`],
};

function stringify(term) {
  switch (term.ctor) {
    case "Var": return term.name;
    case "Ref": return term.name;
    case "Nul": return "null";
    case "Lam": return "λ"+term.name+"."+stringify(term.body);
    case "App": return "("+stringify(term.func)+" "+stringify(term.argm)+")";
    case "Let": return "_"+term.name+"="+stringify(term.expr)+";"+stringify(term.body);
    case "Eli": return "-"+stringify(term.expr);
    case "Ins": return "+"+stringify(term.expr);
    case "Chr": return "'"+term.chrx+"'";
    case "Str": return '"'+term.strx+'"';
    case "Nat": return term.natx;
    default: return "?";
  };
};

function as_adt(term, defs) {
  var term = fmc.reduce(term, defs);
  if (term.ctor === "All" && term.self.slice(-5) === ".Self") {
    var term = term.body(fmc.Var("self",0), fmc.Var("P",0));
    var ctrs = [];
    while (term.ctor === "All") {
      var ctr = (function go(term, flds) {
        if (term.ctor === "All") {
          var flds = term.eras ? flds : flds.concat(term.name);
          return go(term.body(fmc.Var("",0), fmc.Var(term.name,0)), flds);
        } else if (term.ctor === "App") {
          var func = term.func;
          while (func.ctor === "App") {
            func = func.func;
          }
          if (func.ctor === "Var" && func.name === "P") {
            var argm = term.argm;
            while (argm.ctor === "App") {
              argm = argm.func;
            };
            if (argm.ctor === "Ref") {
              return {name: argm.name, flds: flds};
            }
          }
        }
        return null;
      })(term.bind, []);
      if (ctr) {
        ctrs.push(ctr);
        term = term.body(fmc.Var(term.self,0), fmc.Var(term.name,0));
      } else {
        return null;
      }
    }
    return ctrs;
  }
  return null;
};

function dependency_sort(defs, main) {
  var seen = {};
  var refs = [];
  function go(term) {
    switch (term.ctor) {
      case "Ref":
        if (!seen[term.name]) {
          seen[term.name] = true;
          go(defs[term.name].term);
          refs.push(term.name);
        }
        break;
      case "Lam":
        go(term.body(fmc.Var(term.name,0)));
        break;
      case "App":
        go(term.func);
        go(term.argm);
        break;
      case "Let":
        go(term.expr);
        go(term.body(fmc.Var(term.name,0)));
        break;
      case "Def":
        go(term.expr);
        go(term.body(fmc.Var(term.name,0)));
        break;
      case "Ann":
        go(term.expr);
        break;
      case "Loc":
        go(term.expr);
        break;
      case "Nat":
        break;
      case "Chr":
        break;
      case "Str":
        break;
      default:
        break;
    };
  };
  go(defs[main].term);
  return refs;
};

function prim_of(type, defs) {
  for (var prim in is_prim) {
    if (fmc.equal(type, fmc.Ref(prim), defs)) {
      return prim;
    }
  };
  return null;
};

function infer(term, defs, ctx = fmc.Nil()) {
  switch (term.ctor) {
    case "Var":
      return {
        comp: Var(term.name+"_"+term.indx),
        type: fmc.Var(term.name,term.indx),
      };
    case "Ref":
      var got_def = defs[term.name];
      return {
        comp: Ref(term.name),
        type: got_def.type,
      };
    case "Typ":
      return {
        comp: Nul(),
        type: fmc.Typ(),
      };
    case "App":
      var func_cmp = infer(term.func, defs, ctx);
      var func_typ = fmc.reduce(func_cmp.type, defs);
      switch (func_typ.ctor) {
        case "All":
          var self_var = fmc.Ann(true, term.func, func_typ);
          var name_var = fmc.Ann(true, term.argm, func_typ.bind);
          var argm_cmp = check(term.argm, func_typ.bind, defs, ctx);
          var term_typ = func_typ.body(self_var, name_var);
          var comp = func_cmp.comp;
          var func_typ_adt = as_adt(func_typ, defs);
          var func_typ_prim = prim_of(func_typ, defs);
          if (func_typ_prim) {
            comp = Eli(func_typ_prim, comp);
          } else if (func_typ_adt) {
            comp = Eli(func_typ_adt, comp);
          };
          if (!func_typ.eras) {
            comp = App(comp, argm_cmp.comp);
          }
          return {comp, type: term_typ};
        default:
          throw "Non-function application.";
      };
    case "Let":
      var expr_cmp = infer(term.expr, defs, ctx);
      var expr_var = fmc.Ann(true, fmc.Var("_"+term.name, ctx.size+1), expr_cmp.type);
      var body_ctx = fmc.Ext({name:term.name,type:expr_var.type}, ctx);
      var body_cmp = infer(term.body(expr_var), defs, body_ctx);
      return {
        comp: Let("_"+term.name+"_"+(ctx.size+1), expr_cmp.comp, body_cmp.comp),
        type: body_cmp.type,
      };
    case "Def":
      return infer(term.body(term.expr), defs, ctx);
    case "All":
      return {
        comp: Nul(),
        type: fmc.Typ(),
      };
    case "Ann":
      return check(term.expr, term.type, defs, ctx);
    case "Loc":
      return infer(term.expr, defs, ctx);
    case "Nat":
      return {
        comp: Nat(term.natx),
        type: fmc.Ref("Nat"),
      };
    case "Chr":
      return {
        comp: Chr(term.chrx),
        type: fmc.Ref("Char"),
      };
    case "Str":
      return {
        comp: Str(term.strx),
        type: fmc.Ref("String"),
      };
  }
};

function check(term, type, defs, ctx = fmc.Nil()) {
  var typv = fmc.reduce(type, defs);
  if (typv.ctor === "Typ") {
    var comp = Nul();
    var type = fmc.Typ();
    return {comp, type};
  };
  var comp = null;
  switch (term.ctor) {
    case "Lam":
      if (typv.ctor === "All") {
        var self_var = fmc.Ann(true, term, type);
        var name_var = fmc.Ann(true, fmc.Var("_"+term.name, ctx.size+1), typv.bind);
        var body_typ = typv.body(self_var, name_var);
        var body_ctx = fmc.Ext({name:term.name,type:name_var.type}, ctx);
        var body_cmp = check(term.body(name_var), body_typ, defs, body_ctx);
        if (typv.eras) {
          comp = body_cmp.comp;
        } else {
          comp = Lam("_"+term.name+"_"+(ctx.size+1), body_cmp.comp);
        }
        var type_adt = as_adt(type, defs);
        var type_prim = prim_of(type, defs);
        if (type_prim) {
          comp = Ins(type_prim, comp);
        } else if (type_adt) {
          comp = Ins(type_adt, comp);
        }
      } else {
        throw "Lambda has non-function type.";
      }
      return {comp, type};
    case "Let":
      var expr_cmp = infer(term.expr, defs, ctx);
      var expr_var = fmc.Ann(true, fmc.Var("_"+term.name, ctx.size+1), expr_cmp.type);
      var body_ctx = fmc.Ext({name:term.name,type:expr_var.type}, ctx);
      var body_cmp = check(term.body(expr_var), type, defs, body_ctx);
      return {
        comp: Let("_"+term.name+"_"+(ctx.size+1), expr_cmp.comp, body_cmp.comp),
        type: body_cmp.type,
      };
    case "Loc":
      return check(term.expr, type, defs);
    default:
      var term_cmp = infer(term, defs, ctx);
      var comp = term_cmp.comp;
      return {comp, type};
  };
};

function core_to_comp(defs, main) {
  var comp_nams = dependency_sort(defs, main);
  if (comp_nams.indexOf(main) === -1) comp_nams.push(main);
  var comp_defs = {};
  for (var name of comp_nams) {
    comp_defs[name] = check(defs[name].term, defs[name].type, defs).comp;
  };
  return {
    defs: comp_defs,
    nams: comp_nams,
  };
};

function adt_type(adt) {
  var inst = [];
  var elim = {
    ctag: x => x,
    ctor: [],
  };
  var cnam = [];
  for (let i = 0; i < adt.length; ++i) {
    inst.push([adt[i].flds.length, (function go(j, ctx) {
      if (j < adt[i].flds.length) {
        return x => go(j + 1, ctx.concat([x]));
      } else {
        var res = "("+i+",\\t-> t";
        for (var k = 0; k < j; ++k) {
          res += " "+ctx[k];
        };
        res += ")";
        return res;
      };
    })(0, [])]);
    elim.ctor.push(adt[i].flds.map((n,j) => (x => x+"."+adt[i].flds[j])));
    cnam.push(adt[i].name);
  };
  var cnam = {mode: "case", nams: cnam};
  return {inst, elim, cnam};
};

var count = 0;
function fresh() {
  return "_"+(count++);
};

// Simple substitution, assumes `name` is globally unique.
function subst(term, name, val) {
  switch (term.ctor) {
    case "Var": return term.name === name ? val : term;
    case "Ref": return Ref(term.name);
    case "Lam": return Lam(term.name, term.name === name ? term.body : subst(term.body, name, val));
    case "App": return App(subst(term.func, name, val), subst(term.argm, name, val));
    case "Let": return Let(term.name, subst(term.expr, name, val), term.name === name ? term.body : subst(term.body, name, val));
    case "Eli": return Eli(term.prim, subst(term.expr, name, val));
    case "Ins": return Ins(term.prim, subst(term.expr, name, val));
    default: return term;
  }
};
  
// Builds a lambda by filling a template with args.
function build_from_template(arity, template, args) {
  var res = "";
  for (var i = args.length; i < arity; ++i) {
    res += ("\\a"+i)+"-> ";
  };
  var bod = template;
  for (var i = 0; i < Math.min(args.length, arity); ++i) {
    bod = bod(js_code(args[i]));
  };
  for (var i = args.length; i < arity; ++i) {
    bod = bod("a"+i);
  };
  for (var i = arity; i < args.length; ++i) {
    bod = bod+" "+js_code(args[i]);
  };
  return "("+res+bod+")";
};

// Inlines a list of arguments in lambdas, as much as possible. Example:
// apply_inline((x) (y) f, [a, b, c, d, e]) = f[x<-a,y<-b](c)(d)(e)
function apply_inline(term, args) {
  if (term.ctor === "Lam" && args.length > 0) {
    return apply_inline(subst(term.body, term.name, args[0]), args.slice(1));
  } else if (args.length > 0) {
    return apply_inline(App(term, args[0]), args.slice(1));
  } else {
    return term;
  }
};

function application(func, allow_empty = false) {
  var args = [];
  while (func && func.ctor === "App") {
    args.push(func.argm);
    func = func.func;
  };
  args.reverse();

  if (!allow_empty && args.length === 0) {
    return null;
  }

  // Primitive function application
  if (func && func.ctor === "Ref" && prim_funcs[func.name]) {
    if (func.name === "Nat.to_u8" && args.length === 1 && args[0].ctor === "Nat") {
      return String(Number(args[0].natx));
    } else if (func.name === "Nat.to_u16" && args.length === 1 && args[0].ctor === "Nat") {
      return String(Number(args[0].natx));
    } else if (func.name === "Nat.to_u32" && args.length === 1 && args[0].ctor === "Nat") {
      return String(Number(args[0].natx));
    } else if (func.name === "Nat.to_u64" && args.length === 1 && args[0].ctor === "Nat") {
      return String(args[0].natx);
    } else if (func.name === "Nat.to_u256" && args.length === 1 && args[0].ctor === "Nat") {
      return String(args[0].natx);
    } else {
      var [arity, template] = prim_funcs[func.name];
      return build_from_template(arity, template, args);
    }

  // Primitive type elimination
  } else if (func && func.ctor === "Eli") {
    if (typeof func.prim === "string" && prim_types[func.prim]) {
      var type_info = prim_types[func.prim];
    } else if (typeof func.prim === "object") {
      var type_info = adt_type(func.prim);
    } else {
      return null;
    };
    var {ctag, ctor} = type_info.elim;
    var nams = type_info.cnam.nams;
    var mode = type_info.cnam.mode;
    var res = "";
    res += "(";
    for (var i = args.length; i < ctor.length; ++i) {
      res += ("\\c"+i)+"-> ";
    };
    var slf = fresh();
    res += "let "+slf+" = "+js_code(func.expr)+" in ";
    switch (mode) {
      case "case":
        res += "(case "+ctag(slf)+" of {";
        for (var i = 0; i < ctor.length; ++i) {
          res += "("+i+",f) -> u f (";
          if (ctor[i].length > 0) res += "\\";
          var vars = [];
          for (var j = 0; j < ctor[i].length; ++j) {
            var nam = fresh();
            vars.push(Var(nam));
            res += (j>0?" ":"")+nam;
          };
          if (ctor[i].length > 0) res += "-> ";
          res += js_code(apply_inline(args[i]||Var("c"+i), vars));
          res += "); ";
        };
        res += "})";
        break;
      case "if":
        res += "(if "+ctag(slf)+" then ";
        var vars = [];
        for (var j = 0; j < ctor[0].length; ++j) {
          vars.push(ctor[0][j](slf));
        }
        res += js_code(apply_inline(args[0]||Var("c"+0), vars));
        res += " else ";
        var vars = [];
        for (var j = 0; j < ctor[1].length; ++j) {
          vars.push(ctor[1][j](slf));
        }
        res += js_code(apply_inline(args[1]||Var("c"+1), vars));
        res += ")"
        break;
      case "one":
        var vars = [];
        for (var j = 0; j < ctor[0].length; ++j) {
          vars.push(ctor[0][j](slf));
        }
        res += js_code(apply_inline(args[0]||Var("c"+0), vars));
        break;
    }
    res += ")";
    for (var i = ctor.length; i < args.length; ++i) {
      res += " "+js_code(args[i]);
    };
    return res;
  }

  return null;
};

function instantiation(term) {
  if (term.ctor === "Ins") {
    if (typeof term.prim === "string" && prim_types[term.prim]) {
      var templates = prim_types[term.prim].inst;
    } else if (typeof term.prim === "object") {
      var templates = adt_type(term.prim).inst;
    } else {
      return null;
    }
    term = term.expr;
    var vars = [];
    while (term.ctor === "Lam") {
      vars.push(term.name);
      term = term.body;
    }
    if (templates.length === vars.length) {
      var func = term;
      var args = [];
      while (func.ctor === "App") { 
        args.push(func.argm);
        func = func.func;
      };
      args.reverse();
      if (func.ctor === "Var" || func.ctor === "Ref") {
        for (var i = 0; i < vars.length; ++i) {
          if (func.name === vars[i]) {
            var [ctor_arity, ctor_template] = templates[i];
            if (ctor_arity === args.length) {
              var res = ctor_template;
              for (var arg of args) {
                res = res(js_code(arg));
              };
              return res;
            };
          }
        };
      };
    };
  };
  return null;
};

function instantiator(inst) {
  var ctors = inst;
  var res = "(\\x-> x";
  for (var i = 0; i < ctors.length; ++i) {
    var [ctor_arity, ctor_template] = ctors[i];
    for (var j = 0; j < ctor_arity; ++j) {
      res += "\\x"+j+"->";
    };
    var bod = ctor_template;
    for (var j = 0; j < ctor_arity; ++j) {
      bod = bod("x"+j);
    };
    res += " "+bod;
  };
  res += ")";
  return res;
};

function print_str(str) {
  return JSON.stringify(str);
}

function js_code(term, name, top_name = null) {
  var app = application(term);
  var ins = instantiation(term);
  if (app) {
    return app;
  } else if (ins) {
    return ins;
  } else if (typeof term === "string") {
    return term;
  } else {
    switch (term.ctor) {
      case "Var":
        return js_name(term.name);
      case "Ref":
        return js_name(term.name);
      case "Nul":
        return "()";
      case "Lam":
        return "(\\"+js_name(term.name)+"-> "+js_code(term.body)+")";
      case "App":
        return "(u "+js_code(term.func)+" "+js_code(term.argm)+")";
      case "Let":
        return "(let "+js_name(term.name)+"="+js_code(term.expr)+" in "+js_code(term.body)+")";
      case "Eli":
        if (typeof term.prim === "string") {
          return "(elim_"+term.prim.toLowerCase()+" "+js_code(term.expr)+")";
        } else {
          return "()";
        }
      case "Ins":
        if (typeof term.prim === "string") {
          return "(inst_"+term.prim.toLowerCase()+" "+js_code(term.expr)+")";
        } else {
          return "()";
        }
      case "Nat":
        return term.natx;
      case "Chr":
        return term.chrx.codePointAt(0);
      case "Str":
        return print_str(term.strx);
    };
  };
};

function js_name(str) {
  switch (str) {
    case "true": return "_true";
    case "false": return "_false";
    default: return str.replace(/\./g,"_").toLowerCase();
  }
};

// TODO: pass this around instead of making a global object (: I'm tired, ok?
function compile_defs(defs, main, opts) {
  opts = opts || {};

  //console.log("compiling ", main);
  var {defs: cmps, nams} = core_to_comp(defs, main);

  var used_prim_types = {}; 
  for (var prim in prim_types) {
    if (defs[prim]) used_prim_types[prim] = prim_types[prim];
  };
  var used_prim_funcs = {};
  for (var prim in prim_funcs) {
    if (defs[prim]) used_prim_funcs[prim] = prim_funcs[prim];
  };

  // Is main an IO type?
  var isio = fmc.equal(defs[main].type, fmc.App(fmc.Ref("IO"), fmc.Ref("Unit")), defs);

  // Builds header and initial dependencies
  var code = "";

  if (opts.module) {
    code += "module "+(opts.module||"Main")+" where\n";
  }
  code += "import Unsafe.Coerce\n";
  code += "import Data.Word\n";
  code += "import Data.Bits\n";
  code += "import Data.List (intercalate)\n";
  code += "import Debug.Trace\n";
  code += "import System.Exit\n";
  code += "import System.Directory\n";
  code += "import System.FilePath.Posix (takeDirectory)\n";
  code += "u = unsafeCoerce\n";
  if (isio) {
    code += [
      'setFile :: String -> IO ()',
      'setFile param = do',
      '  let path = takeWhile (/= \'=\') param',
      '  let file = drop (length path + 1) param',
      '  createDirectoryIfMissing True (takeDirectory path)',
      '  writeFile path file',
      'delFile :: String -> IO ()',
      'delFile param = do',
      '  isDir <- doesDirectoryExist param',
      '  if isDir then do',
      '    removeDirectory param',
      '  else do',
      '    removeFile param',
      'getDir :: String -> IO String',
      'getDir param = do',
      '  dir <- listDirectory param',
      '  return $ intercalate \";\" dir',
      'run p = case p of {',
      '  (1,f) -> (u f (\\query param cont-> case query of {',
      '    "print"    -> do { putStrLn param; run (cont ()); };',
      '    "exit"     -> do { exitFailure; run (cont ()); };',
      '    "get_line" -> do { line <- getLine; run (u cont line); };', // TODO: not crash when file doesn't exist (:
      '    "set_file" -> do { setFile param; run (u cont ""); };',
      '    "get_file" -> do { line <- readFile param; run (u cont line); };',
      '    "del_file" -> do { delFile param; run (u cont ""); };',
      '    "get_dir" -> do { dir <- getDir param; run (u cont dir); };',
      '    otherwise  -> do { u cont (); };',
      '  }));',
      '  (0,f) -> (u f (\\value-> do { (return :: a -> IO a) value; }));',
      '}'
    ].join("\n")+"\n";
  }

  if (used_prim_types["U16"]) {
    code += [
      "word_to_u16       w        = u word_to_u16_go 0 w 0",
      "word_to_u16_go 16 w      x = u x",
      "word_to_u16_go  i (0,f)  x = u word_to_u16_go (i+1) (0,\\t-> t) (x::Word16)",
      "word_to_u16_go  i (1,f)  x = u f (\\w-> word_to_u16_go (i+1) w x)",
      "word_to_u16_go  i (2,f)  x = u f (\\w-> word_to_u16_go (i+1) w (x .|. (shiftL 1 i)))",
      "u16_to_word       x        = u u16_to_word_go 0 x (0,\\t-> t)",
      "u16_to_word_go 16 x      w = u w",
      "u16_to_word_go  i x      w = u u16_to_word_go (i+1) (x::Word16) (if (shiftR x (16-i-1) .&. 1) > 0 then (2,\\t-> t w) else (1,\\t-> t w))",
    ].join("\n");
    code += "\n";
  }
  // Builds each top-level definition
  var export_names = [];
  for (var name of nams) {
    // Don't compile primitive types
    if (used_prim_types[name]) {
      continue;
    };
    // Generate JS expression
    var expr = null;
    if (used_prim_funcs[name]) {
      code += js_name(name)+" = "+application(Ref(name), true)+"\n";
    } else {
      try {
        var comp = cmps[name];
        var type = defs[name].type;
        if (fmc.equal(type, fmc.Typ(), defs)) {
          continue;
        } else {
          var expr = js_code(comp, name);
          code += js_name(name)+" = "+expr+"\n";
        }
      } catch (e) {
        console.log(e);
        process.exit();
        expr = "'ERROR'";
      };
    };
    export_names.push(name);
  };

  if (!opts.module) {
    if (isio) {
      code += "main = run "+js_name(main);
    } else {
      code += "main = putStrLn "+js_name(main);
    }
  }

  return code;
};

function compile(code, name, opts) {
  return compile_defs(fmc.parse_defs(code), name, opts);
};

module.exports = {compile, compile_defs};
