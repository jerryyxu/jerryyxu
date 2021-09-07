const fs = require('fs/promises');
const github = require('@actions/github');

const { token, repo: repository } = require('args-parser')(process.argv);

const groupBy = (arr, keyFn) => {
  return arr.reduce((rv, x) => {
    const k = keyFn(x);

    if (!rv[k]) {
      rv[k] = [];
    }

    rv[k].push(x);

    return rv;
  }, {});
};

async function run() {
  try {
    const octokit = github.getOctokit(token);
    const [owner, repo] = repository.split('/');

    let { data: issues } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: 'closed',
    });

    // 如果没有设置里程碑 按更新时间分组
    // updated_at: 2021-09-02T14:06:12Z
    issues = groupBy(issues, (x) => {
      return x.milestone ? x.milestone.title : x.updated_at.slice(0, 7);
    });

    let content = '';

    Object.keys(issues)
      .sort((x, y) => (x > y ? -1 : 1))
      .forEach((m) => {
        content += `## ✍ ${m}\n`;

        issues[m]
          .sort((x, y) => (x.update_at > y.update_at ? -1 : 1))
          .forEach(({ title, html_url }) => {
            content += `- [${title}](${html_url})\n`;
          });
      });

    fs.writeFile('README.md', content, { encoding: 'utf8' });
  } catch (err) {
    console.error(err.message);
  }
}

run();
