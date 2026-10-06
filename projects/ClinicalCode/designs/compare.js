'use strict';
const versions = {
  impeccable: ['Impeccable', '居中标题、单列阅读与简洁的资源链接。保留研究图像的主导位置。'],
  taste: ['Taste Skill', '更宽的研究图像、紧凑的作者信息与左侧章节标题。采用 Source Sans 3。'],
  'ui-ux-pro-max': ['UI/UX Pro Max', 'Crimson Pro 衬线标题搭配易读正文，采用偏期刊文章的版式。']
};
const tabs = [...document.querySelectorAll('[data-version]')];
const preview = document.getElementById('preview');
function selectVersion(key) {
  if (!versions[key]) key = 'impeccable';
  for (const tab of tabs) {
    const selected = tab.dataset.version === key;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }
  document.getElementById('preview-panel').setAttribute('aria-labelledby', 'tab-' + key);
  document.getElementById('version-description').textContent = versions[key][1];
  document.getElementById('open-version').href = key + '/';
  preview.title = versions[key][0] + ' 版 ClinicalCode 网页';
  if (preview.getAttribute('src') !== key + '/') preview.src = key + '/';
  const url = new URL(location.href);
  url.searchParams.set('version', key);
  history.replaceState(null, '', url);
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectVersion(tab.dataset.version));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectVersion(tabs[next].dataset.version);
      tabs[next].focus();
    }
  });
});
selectVersion(new URL(location.href).searchParams.get('version'));
