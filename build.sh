for d in ./*; do
  if [ -d "$d" ]; then
    d=${d:2}
    echo "Building: $d"
    ../node_modules/.bin/tsc -p ./$d/tsconfig.json
    header=`cat umd-header`
    header="${header//\{\{MATERIAL_NAME\}\}/$d}"
    content=`cat ./$d/index.js`
    content="${content/var Sein = require(\"seinjs\");/var Sein = window.SeinJS}"
    echo "$header""$content""})));" > ./$d/index.umd.js
    ../node_modules/.bin/uglifyjs --compress --mangle -o ./$d/index.umd.js -- ./$d/index.umd.js
  fi
done
