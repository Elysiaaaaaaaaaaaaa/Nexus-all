const { h5Entry } = require('../../config/runtime');

function withChannelQuery(url) {
  if (!url) return '';
  const hasQuery = url.indexOf('?') !== -1;
  const sep = hasQuery ? '&' : '?';
  return url + sep + 'from=miniprogram';
}

Page({
  data: {
    src: '',
  },
  onLoad() {
    this.setData({ src: withChannelQuery(h5Entry) });
  },
});
