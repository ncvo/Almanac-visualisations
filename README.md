# Integrating into a page

Upload the `app.js` file as well as the `data` and `icons` folders from the
'dist' folder to a web accessible location. Then on the page you want integrate
the visualisation in add a placeholder div:

```html
<div id="moneyflow"></div>
```

Then at the bottom of the page just before the `</body>` tag (exact position
isn't vital, as long as it's below the placeholder div) include the script and
initialise the visualisation passing locations of the icon and data files:

```html
  <script src="/path/to/moneyflow/app.js"></script>
  <script>
    moneyflow({
       dataRoot: '/path/to/moneyflow/data/',
       iconsRoot: '/path/to/moneyflow/icons/',
    });
  </script>
</body>
```

# Building from source

You can use the prebuilt app.js as above without doing this but if you make any
changes to the code in the `src` folder and want to rebuild you can:

1. Make sure a recent node.js is installed
2. Run `npm install .` from inside the respoitory
3. run `npm run build` to build a new `app.js` and to copy over files from the public folder into dist.


You can also run `npm start` to run a "development server" that'll automatically
recompile whenever you change anything (very useful while working on the code).