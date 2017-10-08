# hapijs-react-views

This is an [Hapijs][hapijs] view engine which renders [React][react] components asynchronously on the server. It renders static markup and *does not* support mounting those views on the client.

This is intended to be used as a replacement for existing server-side view solutions, like [jade][jade], [ejs][ejs], or [handlebars][hbs].

> A port of [`express-react-views`](https://github.com/reactjs/express-react-views) to `hapi`

## Usage

```sh
npm i hapijs-react-views react -S
```

**Note:** You must explicitly install `react` as a dependency. Starting in v0.5, `react` is a peer dependency here. This is to avoid issues that may come when using incompatible versions.

### Add it to your app.

```js
// app.js
const hapi = require('hapi');
server = new hapi.Server();
const engine = require('hapijs-react-views')();

server.views({
    defaultExtension: 'jsx',
    engines: {
        jsx: engine, // support for .jsx files
        js: engine // support for .js
    }
});
```

### Options

Beginning with v0.2, you can now pass options in when creating your engine.

option | values | default
-------|--------|--------
`jsx.harmony` | `true`: enable a subset of ES6 features | `false`
`jsx.stripTypes` | `true`: strip [Flow](http://flowtype.org/) type annotations | `false`
`jsx.extension` | any file extension with leading `.` | `".jsx"`
`doctype` | any string that can be used as [a doctype](http://en.wikipedia.org/wiki/Document_type_declaration), this will be prepended to your document | `"<!DOCTYPE html>"`
`caching` | `false`: disable JSX from being cached and regenerate on every call | `true`
`beautify` | `true`: beautify markup before outputting (note, this can affect rendering due to additional whitespace) | `false`

The defaults are sane, but just in case you want to change something, here's how it would look:

```js
const options = { jsx: { harmony: true } };
server.views({
    defaultExtension: 'jsx',
    engines: {
        jsx: require('hapijs-react-views')(options), // support for .jsx files
        js: require('hapijs-react-views')(options) // support for .js
    }
});
```


### Views

Your views should be node modules that export a React component. Let's assume you have this file in `views/index.jsx`:

```js
const React = require('react');

class HelloMessage extends React.Component {
  render() {
    return <div>Hello {this.props.name}</div>;
  }
}

module.exports = HelloMessage;
```

### Routes

Your routes would look identical to the default routes Express gives you out of the box.

```js
// app.js
server.route({
    method: 'GET',
    path: '/',
    config: {
        handler: require('./routes').index
    }
});
```

```js
// routes/index.js

exports.index = function(request, reply){
  reply.view('index', { name: 'John' });
};
```

**That's it!** Layouts follow really naturally from the idea of composition.

### Layouts

Simply pass the relevant props to a layout component.

`views/layouts/default.jsx`:
```js
const React = require('react');

class DefaultLayout extends React.Component {
  render() {
    return (
      <html>
        <head><title>{this.props.title}</title></head>
        <body>{this.props.children}</body>
      </html>
    );
  }
}

module.exports = DefaultLayout;
```

`views/index.jsx`:
```js
const React = require('react');
const DefaultLayout = require('./layouts/default');

class HelloMessage extends React.Component {
  render() {
    return (
      <DefaultLayout title={this.props.title}>
        <div>Hello {this.props.name}</div>
      </DefaultLayout>
    );
  }
}

module.exports = HelloMessage;
```


## Questions

### What about partials & includes?

These ideas don't really apply. But since they are familiar ideas to people coming from more traditional "templating" solutions, let's address it. Most of these can be solved by packaging up another component that encapsulates that piece of functionality.

### What about view helpers?

I know you're used to registering helpers with your view helper (`hbs.registerHelper('something', ...))`) and operating on strings. But you don't need to do that here.

* Many helpers can be turned into components. Then you can just require and use them in your view.
* You have access to everything else in JS. If you want to do some date formatting, you can `require('moment')` and use directly in your view. You can bundle up other helpers as you please.

### Where does my data come from?

All "locals" are exposed to your view in `this.props`. These should work identically to other view engines, with the exception of how they are exposed. Using `this.props` follows the pattern of passing data into a React component, which is why we do it that way. Remember, as with other engines, rendering is synchronous. If you have database access or other async operations, they should be done in your routes.


## Caveats

* I'm saying it again to avoid confusion: this does not do anything with React in the browser. This is *only* a solution for server-side rendering.
* This currently uses `require` to access your views. This means that contents are cached for the lifetime of the server process. You need to restart your server when making changes to your views. **In development, we clear your view files from the cache so you can simply refresh your browser to see changes.**
* React & JSX have their own rendering caveats. For example, inline `<script>`s and `<style>`s will need to use `dangerouslySetInnerHTML={{__html: 'script content'}}`. You can take advantage of ES6 template strings here.

```js
<script dangerouslySetInnerHTML={{__html: `
  // google analtyics
  // is a common use
`}} />
```

* It's not possible to specify a doctype in JSX. You can override the default HTML5 doctype in the options.

[hapijs]: http://hapijs.com/
[react]: http://facebook.github.io/react/
[jade]: http://jade-lang.com/
[ejs]: http://embeddedjs.com/
[hbs]: https://github.com/barc/hapijs-hbs
