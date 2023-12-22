alias env="source venv/bin/activate"
alias build="./compilation/build.py"
alias commit_and_build="build; git reset .; git add compiled; git commit -m 'Build'"

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm