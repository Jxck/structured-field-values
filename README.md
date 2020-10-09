# Structured Field Values

## What is this ?

This is a implementation of [RFCXXXX]() a Structured Field Values in JavaScript.


## Install

```sh
npm install structured-field-values
```

## API

- decodeItem
- decodeList
- decodeDict
- encodeItem
- encodeList
- encodeDict


## Primitives

### Item

SFV has *string* and *token* and this module use Symbol for token.
And SFV has params for every item, so decoded token are always object with `value` & `params`.

```js
decodeItem(`a`)    // { value: Symbol(a), params: {} }
decodeItem(`"a"`)  // { value: `a`,       params: {} }
decodeItem(`10`)   // { value: 10,        params: {} }
decodeItem(`3.14`) // { value: 3.14,      params: {} }
decodeItem(`?0`)   // { value: false,     params: {} }

decodeItem(`"a";x;y=?0;z=10`) // { value: `a`, params: { x: true, y: false, z: 10 } }
```

Note: Symbol generated in decoder is registered globally as Shared Symbol, so you can handle them like.

```js
const a = decodeItem(`a`).value // Symbol(a)
console.log(Symbol.keyFor(a)) // "a" (string)
```

### List

```js
decodeList(`1,2,3`)
// [
//   { value: 1, params: {} },
//   { value: 2, params: {} },
//   { value: 3, params: {} }
// ]

decodeList(`a;x,"b";y=?0,10,(1 2)`)
// [
//   { value: Symbol(a), params: { x: true } },
//   { value: `b`, params: { y: false } },
//   { value: 10, params: {} },
//   { value: [
//              { value: 1, params: {} }
//              { value: 2, params: {} }
//            ], params: {} }
// ]
```

### Dict

```js
decodeDict(`a=x, b="y", c=10, d=?0, e=(1 2)`)
// {
//   a: { value: Symbol(x), params: {} },
//   b: { value: 'y', params: {} },
//   c: { value: 10, params: {} },
//   d: { value: false, params: {} },
//   e: { value: [
//                 { value: 1, params: {} }
//                 { value: 2, params: {} }
//               ], params: {} }
// }
```


## How to test

test includes unittest & httpwg's test.

- https://github.com/httpwg/structured-field-tests.git

you can run all test like below.

```sh
$ git submodule init && git submodule update
$ npm t
```
