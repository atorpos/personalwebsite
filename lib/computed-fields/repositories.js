const repositories = {
  hasSubFields: false,
  resolve: async (repositories) => {
    if (!Array.isArray(repositories) || !process.env.GITHUB_TOKEN) return null

    const records = await Promise.all(
      repositories.filter(Boolean).map(async (repo) => {
        try {
          const res = await fetch('https://api.github.com/repos/' + repo, {
            headers: {
              authorization: 'token ' + process.env.GITHUB_TOKEN,
            },
          })
          const json = await res.json()

          if (!res.ok) {
            throw new Error(json.message || `${res.status} ${res.statusText}`)
          }

          return {
            name: json.name,
            owner: json.owner.login,
            url: json.html_url,
            description: json.description,
            language: json.language,
            stars: json.stargazers_count,
            forks: json.forks_count,
          }
        } catch (error) {
          // A renamed, deleted or mistyped repository, or a GitHub outage, leaves out its card only
          console.warn(`Could not load the GitHub repository ${repo}: ${error.message}`)
          return null
        }
      })
    )

    return { records: records.filter(Boolean) }
  },
}

export default repositories
