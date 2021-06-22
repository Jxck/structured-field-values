# Structured Field Values


## What is this ?

This is a implementation of a [RFC 8941: Structured Field Values for HTTP](https://www.rfc-editor.org/rfc/rfc8941.html) in JavaScript.


## DEMO

- <https://jxck.github.io/structured-field-values/demo.html>


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

SFV has *string* and *token* and this module use Symbol for token.

And SFV has params for every item, so decoded token are always object with `value` & `params`.


```js
decodeItem(`a`)    // Item { value: Symbol(a), params: null }
decodeItem(`"a"`)  // Item { value: `a`,       params: null }
decodeItem(`10`)   // Item { value: 10,        params: null }
decodeItem(`3.14`) // Item { value: 3.14,      params: null }
decodeItem(`?0`)   // Item { value: false,     params: null }

decodeItem(`"a";x;y=?0;z=10`) // Item { value: `a`, params: { x: true, y: false, z: 10 } }
```

Note: Symbol generated in decoder is registered globally as Shared Symbol, so you can handle them like.


```js
const a = decodeItem(`a`).value // Symbol(a)
console.log(Symbol.keyFor(a)) // "a" (string)
```


#### encodeItem


```js
encodeItem(Symbol.for('a')) // `a`
encodeItem("a")             // `"a"`
encodeItem(10)              // `10`
encodeItem(3.14)            // `3.14`
encodeItem(true)            // `?0`

encodeItem(new Item(Symbol.for('a'))) // `a`
encodeItem(new Item("a"))             // `"a"`
encodeItem(new Item(10))              // `10`
encodeItem(new Item(3.14))            // `3.14`
encodeItem(new Item(true))            // `?0`

encodeItem(new Item(`a`, { x: true, y: false, z: 10 })) // `"a";x;y=?0;z=10`
```

Note: JavaScript only supports number


```js
encodeItem(decodeItem('1.0')) // '1' not '1.0'
```


### List


#### decodeList


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
//   Item { value: [
//                   { value: 1, params: null }
//                   { value: 2, params: null }
//                 ], params: null }
// ]
```


#### encodeList


```js
// `1, 2, 3`
encodeList([1,2,3])
encodeList([
  new Item(1),
  new Item(2),
  new Item(3)
])

// `a;x, "b";y=?0, 10, (1 2)`
encodeList([
  new Item(Symbol.for('a'), { x: true  }),
  new Item(`b`,             { y: false }),
  new Item(10),
  new Item([1, 2])
])
```


### Dict


#### decodeDict


```js
decodeDict(`a=x, b="y", c=10, d=?0, e=(1 2)`)
// {
//   a: Item { value: Symbol(x), params: null },
//   b: Item { value: 'y',       params: null },
//   c: Item { value: 10,        params: null },
//   d: Item { value: false,     params: null },
//   e: Item { value: [
//                      Item { value: 1, params: null }
//                      Item { value: 2, params: null }
//                    ], params: null }
// }
```


#### encodeDict


```js
// `a=10, b=20, c=30`
encodeDict({
  a: 10,
  b: 20,
  c: 30,
})

// `a=10, b=20, c=30`
encodeDict(new Map([
                     ['a', 10],
                     ['b', 20],
                     ['c', 30],
                   ])
),


// `a=x, b="y", c=10, d=?0, e=:AQID:, f=(10 20)`
encodeDict({
  a: Symbol.for('x'),
  b: 'y',
  c: 10,
  d: false,
  e: new Uint8Array([1,2,3]),
  f: [10, 20],
})

// `a=x;a, b="y";b=10, c=10;c="test", d=?0, e=(1 2)`
encodeDict({
  a: new Item(Symbol.for('x'), {a: true}),
  b: new Item('y',             {b: 10}),
  c: new Item(10,              {c: "test"}),
  d: new Item(false),
  e: new Item([1, 2]),
})

// `a=1, b=?0, c="x", d=y, e=:AQID:`
encodeDict(new Map([
  ['a', 10],
  ['b', 20],
  ['c', 30],
])),
```


## How to test

test includes unittest & httpwg's test.

- https://github.com/httpwg/structured-field-tests.git

you can run all test like below.


```sh
$ git submodule init && git submodule update
$ npm t
```
