npm ci && npm run dist
cd dist
tar zxvf worldview.tar.gz
npx --yes serve worldview
