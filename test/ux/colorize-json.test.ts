import {expect} from 'chai'

import {stringifyInput, tokenize} from '../../src/ux/colorize-json'

describe('colorizeJson', () => {
  it('tokenizes a basic JSON object', () => {
    const result = tokenize({
      foo: 'bar',
    })

    expect(result).to.deep.equal([
      {type: 'brace', value: '{'},
      {type: 'key', value: '"foo"'},
      {type: 'colon', value: ':'},
      {type: 'string', value: '"bar"'},
      {type: 'brace', value: '}'},
    ])
  })

  it('tokenizes a basic JSON string', () => {
    const result = tokenize('{"foo":"bar"}')

    expect(result).to.deep.equal([
      {type: 'brace', value: '{'},
      {type: 'key', value: '"foo"'},
      {type: 'colon', value: ':'},
      {type: 'string', value: '"bar"'},
      {type: 'brace', value: '}'},
    ])
  })

  it('tokenizes an array', () => {
    const result = tokenize(['foo', 'bar'])

    expect(result).to.deep.equal([
      {type: 'bracket', value: '['},
      {type: 'string', value: '"foo"'},
      {type: 'comma', value: ','},
      {type: 'string', value: '"bar"'},
      {type: 'bracket', value: ']'},
    ])
  })

  it('includes whitespace', () => {
    const result = tokenize('{\n  "foo": "bar"\n}')

    expect(result).to.deep.equal([
      {type: 'brace', value: '{'},
      {type: 'whitespace', value: '\n  '},
      {type: 'key', value: '"foo"'},
      {type: 'colon', value: ':'},
      {type: 'whitespace', value: ' '},
      {type: 'string', value: '"bar"'},
      {type: 'whitespace', value: '\n'},
      {type: 'brace', value: '}'},
    ])
  })

  it('tokenizes boolean values', () => {
    let result = tokenize('true')
    expect(result).to.deep.equal([{type: 'boolean', value: 'true'}])

    result = tokenize('false')
    expect(result).to.deep.equal([{type: 'boolean', value: 'false'}])
  })

  it('tokenizes integer values', () => {
    let result = tokenize('123')
    expect(result).to.deep.equal([{type: 'number', value: '123'}])

    result = tokenize('-10')
    expect(result).to.deep.equal([{type: 'number', value: '-10'}])
  })

  it('tokenizes a decimal number', () => {
    const result = tokenize('1.234')
    expect(result).to.deep.equal([{type: 'number', value: '1.234'}])
  })

  it('tokenizes a scientific notation number', () => {
    let result = tokenize('12e5')
    expect(result).to.deep.equal([{type: 'number', value: '12e5'}])

    result = tokenize('12e+5')
    expect(result).to.deep.equal([{type: 'number', value: '12e+5'}])

    result = tokenize('12E-5')
    expect(result).to.deep.equal([{type: 'number', value: '12E-5'}])
  })

  it('tokenizes null', () => {
    const result = tokenize('null')
    expect(result).to.deep.equal([{type: 'null', value: 'null'}])
  })

  it('tokenizes a string literal with brace characters', () => {
    const result = tokenize('"{hello}"')
    expect(result).to.deep.equal([{type: 'string', value: '"{hello}"'}])
  })

  it('tokenizes a string literal with bracket characters', () => {
    const result = tokenize('"[hello]"')
    expect(result).to.deep.equal([{type: 'string', value: '"[hello]"'}])
  })

  it('tokenizes a string literal with an escaped quote', () => {
    const result = tokenize('"a\\"b"')
    expect(result).to.deep.equal([{type: 'string', value: '"a\\"b"'}])
  })

  it('tokenizes a key-value pair with whitespace between the :', () => {
    const result = tokenize('"foo" : "bar"')
    expect(result).to.deep.equal([
      {type: 'key', value: '"foo"'},
      {type: 'whitespace', value: ' '},
      {type: 'colon', value: ':'},
      {type: 'whitespace', value: ' '},
      {type: 'string', value: '"bar"'},
    ])
  })

  it('given an undefined json when get token should have no results', () => {
    const result = tokenize()

    expect(result).to.deep.equal([])
  })

  it('removes circular references from json', () => {
    const obj = {
      foo: 'bar',
      baz: {
        qux: 'quux',
      },
    }
    // @ts-expect-error
    obj.circular = obj

    const result = tokenize(obj)
    expect(result).to.deep.equal([
      {type: 'brace', value: '{'},
      {type: 'key', value: '"foo"'},
      {type: 'colon', value: ':'},
      {type: 'string', value: '"bar"'},
      {type: 'comma', value: ','},
      {type: 'key', value: '"baz"'},
      {type: 'colon', value: ':'},
      {type: 'brace', value: '{'},
      {type: 'key', value: '"qux"'},
      {type: 'colon', value: ':'},
      {type: 'string', value: '"quux"'},
      {type: 'brace', value: '}'},
      {type: 'comma', value: ','},
      {type: 'key', value: '"circular"'},
      {type: 'colon', value: ':'},
      {type: 'string', value: '"[Circular ~]"'},
      {type: 'brace', value: '}'},
    ])
  })
})

describe('formatInput', () => {
  it('converts a json object to a string', () => {
    const obj = {
      foo: 'bar',
      baz: {
        qux: 'quux',
      },
    }

    const result = stringifyInput(obj)
    expect(result).to.equal('{"foo":"bar","baz":{"qux":"quux"}}')
  })

  it('converts a json string to a string', () => {
    const objString = '{"foo":"bar","baz":{"qux":"quux"}}'

    const result = stringifyInput(objString)
    expect(result).to.deep.equal(objString)
  })

  it('adds indentation to json object when pretty is true', () => {
    const obj = {
      foo: 'bar',
      baz: {
        qux: 'quux',
      },
    }

    const result = stringifyInput(obj, {pretty: true})
    expect(result).to.equal(`{
  "foo": "bar",
  "baz": {
    "qux": "quux"
  }
}`)
  })

  it('adds indentation to json string when pretty is true', () => {
    const objString = '{"foo":"bar","baz":{"qux":"quux"}}'

    const result = stringifyInput(objString, {pretty: true})
    expect(result).to.equal(`{
  "foo": "bar",
  "baz": {
    "qux": "quux"
  }
}`)
  })

  it('removes circular references from json objects', () => {
    const obj = {
      foo: 'bar',
      baz: {
        qux: 'quux',
      },
    }
    // @ts-expect-error
    obj.circular = obj

    const result = stringifyInput(obj)

    expect(JSON.parse(result)).to.deep.equal({
      foo: 'bar',
      baz: {
        qux: 'quux',
      },
      circular: '[Circular ~]',
    })
  })

  it('removes circular references from objects in json array', () => {
    const obj = {
      foo: 'bar',
      baz: {
        qux: 'quux',
      },
    }
    // @ts-expect-error
    obj.circular = obj
    const arr = [{foo: 'bar'}, obj]

    const result = stringifyInput(arr)
    expect(JSON.parse(result)).to.deep.equal([
      {
        foo: 'bar',
      },
      {
        baz: {
          qux: 'quux',
        },
        foo: 'bar',
        circular: '[Circular ~.1]',
      },
    ])
  })

  it('does not remove repeated objects', () => {
    const repeatedObj = {
      name: 'FooBar',
      state: 'Unchanged',
      path: '/path/to/file.txt',
    }
    const obj = {
      key1: [{key2: [repeatedObj]}],
      key2: [repeatedObj],
    }

    const result = JSON.parse(stringifyInput(obj))
    expect(result.key1[0].key2[0]).to.deep.equal(repeatedObj)
    expect(result.key2[0]).to.deep.equal(repeatedObj)
  })
})
