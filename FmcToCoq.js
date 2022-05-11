const fmc = require("./FormCore.js");

// Coq (simplified) Abstract Syntax
// ====

// Coq variables
const CoqVar = (name, indx) => ({ ctor: "Var", name, indx });
// Coq references to defined objects
const CoqRef = (name) => ({ ctor: "Ref", name });
// Coq "Type"
const CoqTyp = () => ({ ctor: "Typ" });
// Coq dependent products
const CoqAll = (name, bind, body) => ({ ctor: "All", name, bind, body });
// Coq lambdas
const CoqLam = (name, body) => ({ ctor: "Lam", name, body });
// Coq applications
const CoqApp = (func, argm) => ({ ctor: "App", func, argm });
// Coq let-bindings
const CoqLet = (name, expr, body) => ({ ctor: "Let", name, expr, body });
// Coq definitions
const CoqDef = (name, expr, body) => ({ ctor: "Def", name, expr, body });
// Coq Theorems
const CoqThm = (name, stmt, proof) => ({ ctor: "Thm", name, stmt, proof });

/**
 * Compiler from Core to Coq.
 * 
 * This compiler can't be complete for theoretical reasons:
 * it tries to generate Coq code from Core but might
 * fail or generate Coq code that is going to be rejected 
 * by the Coq compiler.
 * 
 * @param {*} fmc_ast Core code
 * @param {*} name name of the source
 * @param {*} opts options
 */
let compile_defs = (fmc_ast, name, opts) => {
  throw "Not implemented";
}

let compile = (fmc_code, name, opts) => {
  compile_defs(fmc.parse_defs(fmc_code), name, opts)
}

module.exports = { compile, compile_defs };