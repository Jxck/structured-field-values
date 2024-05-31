# Structured Field Values

## What is this ?

This is a implementation of a [RFC 8941: Structured Field Values for HTTP](https://www.rfc-editor.org/rfc/rfc8941.html) in JavaScript.

And also Date type in [sfbis-06](https://www.ietf.org/archive/id/draft-ietf-httpbis-sfbis-06.html) is also supported.

## DEMO

- https://jxck.github.io/structured-field-values/demo.html

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

#### decodeItem

decode Item as JS `Items` object.

`Item` has decoded Primitives / Date / Uint8Array as `value` and parameters into `params`

Token in SFV will be decoded as JS Symbol.

```js
decodeItem(`a`)      // Item { value: Symbol(a), params: null } (token)
decodeItem(`"a"`)    // Item { value: `a`,       params: null }
decodeItem(`10`)     // Item { value: 10,        params: null }
decodeItem(`3.14`)   // Item { value: 3.14,      params: null }
decodeItem(`?0`)     // Item { value: false,     params: null }

decodeItem(`:AQID:`)
// Item { value: Uint8Array(3) [ 1, 2, 3 ], params: null }

decodeItem(`@1659578233`)
// Item { value: new Date(`2022-08-04T01:57:13.000Z`), params: null }

decodeItem(`"a";x;y=?0;z=10`)
// Item { value: `a`, params: { x: true, y: false, z: 10 } }
```

Note: Symbol generated in decoder is registered globally as Shared Symbol, so you can handle them like.

```js
const a = decodeItem(`a`).value // Symbol(a)
console.log(Symbol.keyFor(a)) // "a" (string)
```

#### encodeItem

encode JS Primitives & Date/Uint8Array into Item

```js
encodeItem(Symbol.for("a"))             // `a` (token)
encodeItem("a")                         // `"a"`
encodeItem(10)                          // `10`
encodeItem(3.14)                        // `3.14`
encodeItem(true)                        // `?0`
encodeItem(new Date(1659578233000))     // 2022-08-04T01:57:13.000Z
encodeItem(new Uint8Array([ 1, 2, 3 ])) // :AQID:

// with parameter
encodeItem(new Item(`a`, { x: true, y: false, z: 10 })) // `"a";x;y=?0;z=10`
```

Note: JavaScript only supports number

```js
encodeItem(decodeItem("1.0")) // '1' not '1.0'
```

### List

#### decodeList

decode List as JS Array

```js
decodeList(`1,2,3`)
// [
//   Item { value: 1, params: null },
//   Item { value: 2, params: null },
//   Item { value: 3, params: null }
// ]

decodeList(`a;x,"b";y=?0,10,(1 2)`)
// [
//   Item { value: Symbol(a), params: { x: true } },
//   Item { value: `b`,       params: { y: false } },
//   Item { value: 10,        params: null },
//   InnerList { value: [
//                   Item { value: 1, params: null }
//                   Item { value: 2, params: null }
//               ], params: null }
// ]
```

#### encodeList

encode JS Array into List

```js
// `1, 2, 3`
encodeList([1, 2, 3])
encodeList([new Item(1), new Item(2), new Item(3)])

// a, "b", 10, (1 2)
encodeList([Symbol.for("a"), `b`, 10, [1, 2]])

// `a;x, "b";y=?0, 10, (1 2)`
encodeList([new Item(Symbol.for("a"), { x: true }), new Item(`b`, { y: false }), new Item(10), new Item([1, 2])])
```

### Dict

#### decodeDict

decode Dictionary as JS Object

```js
decodeDict(`a=x, b="y", c=10, d=?0, e=(1 2)`)
// {
//   a: Item { value: Symbol(x), params: null },
//   b: Item { value: 'y',       params: null },
//   c: Item { value: 10,        params: null },
//   d: Item { value: false,     params: null },
//   e: InnerList { value: [
//                      Item { value: 1, params: null }
//                      Item { value: 2, params: null }
//                  ], params: null }
// }
```

#### decodeMap

decode Dictionary as JS **Map**

```js
decodeMap(`a=x, b="y", c=10, d=?0, e=(1 2)`)
// Map(5) {
//   'a' => Item { value: Symbol(x), params: null },
//   'b' => Item { value: 'y', params: null },
//   'c' => Item { value: 10, params: null },
//   'd' => Item { value: false, params: null },
//   'e' => InnerList { value: [ [Item], [Item] ], params: null }
// }
```

#### encodeDict

encode JS Object / Map into Dictionary

```js
// `a=10, b=20, c=30`
encodeDict({
  a: 10,
  b: 20,
  c: 30
})

// `a=10, b=20, c=30`
encodeDict(
  new Map([
    ["a", 10],
    ["b", 20],
    ["c", 30]
  ])
)

// `a=x, b="y", c=10, d=?0, e=:AQID:, f=(10 20)`
encodeDict({
  a: Symbol.for("x"),
  b: "y",
  c: 10,
  d: false,
  e: new Uint8Array([1, 2, 3]),
  f: [10, 20]
})

// `a=x;a, b="y";b=10, c=10;c="test", d=?0, e=(1 2)`
encodeDict({
  a: new Item(Symbol.for("x"), { a: true }),
  b: new Item("y", { b: 10 }),
  c: new Item(10, { c: "test" }),
  d: new Item(false),
  e: new Item([1, 2])
})
```

## How to test

test includes unittest & httpwg test.

- https://github.com/httpwg/structured-field-tests.git

you can run all test like below.

```sh
$ git submodule init && git submodule update
$ npm t
```
