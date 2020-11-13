FormCoreJS
==========

A pure JavaScript implementation of FormCore.

Usage
-----

Install with `npm i -g formcore-lang`. Type `fmc` to see the available commands.

- `fmc file.fmc`: checks all types in `file.fmc`

- `fmc file.fmc --js main`: compiles `main` on `file.fmc` to JavaScript

As a library:

```
var {fmc} = require("formcore-lang");
fmc.report(`
  id : @(A: *) @(x: A) A = #A #x x;
`);
```

What is FormCore?
-----------------

FormCore is a minimal pure functional language based on self dependent types.
It is, essentially, the simplest language capable of theorem proving via
inductive reasoning. Its syntax is simple:

ctr  | syntax                   | description
---- | ------------------------ | -----------
all  | `@self(name: xtyp) rtyp` | function type
all  | `%self(name: xtyp) rtyp` | like all, erased before compile
lam  | `#var body`              | pure, curried, anonymous, function
app  | `(func argm)`            | applies a lam to an argument
let  | `!x = expr; body`        | local definition
def  | `$x = expr; body`        | like let, erased before check/compile
ann  | `{term : type}`          | inline type annotation
nat  | `+decimal`               | natural number, unrolls to lambdas
chr  | `'x'`                    | UTF-16 character, unrolls to lambdas
str  | `"content"`              | UTF-16 string, unrolls to lambdas

It has two main uses:

### A minimal, auditable proof kernel

Proof assistants are used to verify software correctness, but who verifies the
verifier? With FormCore, proofs in complex languages like [Formality](https://github.com/moonad/formality)
can be compiled to a minimal core and checked again, protecting against bugs on
the proof language itself. As for FormCore itself, since it is very small, it
can be audited manually by humans, ending the loop.

### An intermediate format for functional compilation

FormCore can be used as an common intermediate format which other functional
languages can target, in order to be transpiled to other languages. FormCore's
purity and rich type information allows one to recover efficient programs from
it. Right now, we use FormCore to compile [Formality](https://github.com/moonad/formality)
to JavaScript, but other source and target languages could be involved.

The JavaScript Compiler
------------------------

This implementation includes a high-quality compiler from FormCore to
JavaScript. That compiler uses type information to convert highly functional
code into efficient JavaScript. For example, the compiler will convert these
λ-encodings to native representations:

Formality | JavaScript
--------- | ----------
Unit      | Number
Bool      | Bool
Nat       | BigInt
U8        | Number
U16       | Number
U32       | Number
U64       | BigInt
String    | String
Bits      | String

Moreover, it will also convert any suitable user-defined self-encoded datatype
to trees of native objects, using `switch` to pattern-match. It will also swap
known functions like `Nat.mul` to native `*`, `String.concat` to native `+` and
so on. It also performs tail-call optimization and inlines certain functions,
including converting `List.for` to inline loops, for example.

Example
-------

The program uses self dependent datatypes to implement booleans, propositional
equality, the boolean negation function, and proves that double negation is the
identity (`∀ (b: Bool) -> not(not(b)) == b`):

```c
Bool : * =
  %self(P: @(self: Bool) *)
  @(true: (P true))
  @(false: (P false))
  (P self);

true : Bool =
  #P #t #f t;

false : Bool =
  #P #t #f f;

not : @(x: Bool) Bool =
  #x (((x #self Bool) false) true);

Equal : @(A: *) @(a: A) @(b: A) * =
  #A #a #b
  %self(P: @(b: A) @(self: (((Equal A) a) b)) *)
  @(refl: ((P a) ((refl A) a)))
  ((P b) self);

refl : %(A: *) %(a: A) (((Equal A) a) a) =
  #A #x #P #refl refl;

double_negation_theorem : @(b: Bool) (((Equal Bool) (not (not b))) b) =
  #b (((b #self (((Equal Bool) (not (not self))) self))
    ((refl Bool) true))
    ((refl Bool) false));

main : Bool =
  (not false);
```

It is equivalent to this [Formality](https://github.com/moonad/formality)
snippet:

```c
// The boolean type
type Bool {
  true,
  false,
}

// Propositional equality
type Equal <A: Type> (a: A) ~ (b: A) {
  refl ~ (b: a)
}

// Boolean negation
not(b: Bool): Bool
  case b {
    true: Bool.false,
    false: Bool.true,
  }

// Proof that double negation is identity
theorem(b: Bool): Equal(Bool, not(not(b)), b)
  case b {
    true: Equal.refl<Bool, Bool.true>,
    false: Equal.refl<Bool, Bool.false>,
  } : Equal(Bool, not(not(b.self)), b.self)
```
