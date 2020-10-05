# Structured Field Values

## What is this ?

This is a implementation of [RFCXXXX]() a Structured Field Values in JavaScript.


## Install

```sh
npm install structured-field-values
```

## API

```js
const sfv = require("structured-field-values")

sfv.parseItem("a;x=?1")
// { value: 'a', params: { x: true } }

sfv.parseList("a,b,(1 2)")
// [
//   { value: 'a', params: {} },
//   { value: 'b', params: {} },
//   { value: [
//              { value: 1 , params: {} },
//              { value: 2 , params: {} },
//            ]
//     params: {}
//   }
// ]

parseDict("a=(1 2); q=1.0")
// {
//   'a': {
//     value: [
//       { value: 1, params: {} },
//       { value: 2, params: {} }
//     ],
//     params: { "q": 1 }
//   }
// }
```
