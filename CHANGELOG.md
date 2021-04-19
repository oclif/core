# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.5.3](https://github.com/oclif/core/compare/v0.5.2...v0.5.3) (2021-04-19)

### [0.5.2](https://github.com/oclif/core/compare/v0.5.1...v0.5.2) (2021-04-19)

### [0.5.1](https://github.com/oclif/core/compare/v0.5.0...v0.5.1) (2021-04-15)


### Features

* support misspelled spaced commands ([#143](https://github.com/oclif/core/issues/143)) ([50c1789](https://github.com/oclif/core/commit/50c1789120a4d73703c0ce560a6a312d391f594a))

# [0.5.0](https://github.com/oclif/core/compare/v0.4.0...v0.5.0) (2021-04-08)


### Bug Fixes

* don't resolve lib to src in development mode ([#129](https://github.com/oclif/core/issues/129)) ([abd10fd](https://github.com/oclif/core/commit/abd10fdbb313c25170f4492cc8dfea8ffa3a9928))



# [0.4.0](https://github.com/oclif/core/compare/v0.3.0...v0.4.0) (2021-03-01)


### Features

* add topic separator option ([#111](https://github.com/oclif/core/issues/111)) ([b3ca07f](https://github.com/oclif/core/commit/b3ca07f4e6f7e6e87e675a9de0dbce611a9f1950))



# [0.3.0](https://github.com/oclif/core/compare/v0.2.0...v0.3.0) (2021-02-01)


### Bug Fixes

* default ExitError to exit error code 1 ([#95](https://github.com/oclif/core/issues/95)) ([2005c5f](https://github.com/oclif/core/commit/2005c5f092dc60c0cfafcb1d5c90fd62c2048dca))
* filter help argvs before invoking ([#103](https://github.com/oclif/core/issues/103)) ([698125d](https://github.com/oclif/core/commit/698125d602de9bc085b4080768a564a7b01fe27d))
* only --version & --help are special global flags ([#96](https://github.com/oclif/core/issues/96)) ([364d6dd](https://github.com/oclif/core/commit/364d6dd8fd5a54334a6e77255cd6b3a5e7321632))


### Features

* add default command (rm root cmd) ([#97](https://github.com/oclif/core/issues/97)) ([fbf1a0f](https://github.com/oclif/core/commit/fbf1a0f827208da75c77009fedd48b8886a00520))
* args read stdin ([#100](https://github.com/oclif/core/issues/100)) ([caea554](https://github.com/oclif/core/commit/caea55484c0cdf6803b9fa472f9fa8a622f57a80))
* parse async ([#99](https://github.com/oclif/core/issues/99)) ([57924df](https://github.com/oclif/core/commit/57924df5c168b677df9d1d1f43155a89e9cb2c98))
* rm duplicate ts-node registering ([#102](https://github.com/oclif/core/issues/102)) ([b8b5333](https://github.com/oclif/core/commit/b8b5333047eb939e79c8cadf460e3c76ff751460))
* run single & multi cmd clis with same invoking/runner ([#98](https://github.com/oclif/core/issues/98)) ([8828ca9](https://github.com/oclif/core/commit/8828ca9d05f87bc321bbd2394191b194764bba7a))



# [0.2.0](https://github.com/oclif/core/compare/v0.1.2...v0.2.0) (2020-09-18)


### Bug Fixes

* capitalize Flags module export ([#41](https://github.com/oclif/core/issues/41)) ([9b1d2a8](https://github.com/oclif/core/commit/9b1d2a8f8bae42f2b5e1115db42adc6d159e351b))
* config debug scope ([#38](https://github.com/oclif/core/issues/38)) ([be0d001](https://github.com/oclif/core/commit/be0d0018637d3809e487fb750a1e7166a49f70bd))
* export TSConfig in Interfaces ([#43](https://github.com/oclif/core/issues/43)) ([187f5b8](https://github.com/oclif/core/commit/187f5b8a8f98e6e743ebd5cd45cae2f36a1b0781))


### Features

* export Config, Plugin at root & namespace interfaces ([#40](https://github.com/oclif/core/issues/40)) ([0817fc0](https://github.com/oclif/core/commit/0817fc0133859ddf98b4d85f29839d5dadc7ec6e))
* export HelpOptions in Interfaces ([#45](https://github.com/oclif/core/issues/45)) ([5d4212f](https://github.com/oclif/core/commit/5d4212f6a3f8f56c66b6eeb4680da0ad0c944325))
* export OclifError & PrettyPrintableError in Interfaces ([#44](https://github.com/oclif/core/issues/44)) ([766b6f5](https://github.com/oclif/core/commit/766b6f553f3861e247258142005a8ca035c209af))
* export parser interfaces in Interfaces ([#46](https://github.com/oclif/core/issues/46)) ([d5ad46d](https://github.com/oclif/core/commit/d5ad46db55f9510e5cd3235111fe93bfa4a4c1c4))
* mv Command & flag export to root ([#37](https://github.com/oclif/core/issues/37)) ([70ea6e1](https://github.com/oclif/core/commit/70ea6e16ada0ce18ebbeb52ed9802d3a1536276d))
* mv getHelpClass, Help & HelpBase export to root ([#39](https://github.com/oclif/core/issues/39)) ([3d272d8](https://github.com/oclif/core/commit/3d272d8a5308e1063326bcfc1eb8998c2a4f8585))



## [0.1.2](https://github.com/oclif/core/compare/v0.1.1...v0.1.2) (2020-09-11)


### Bug Fixes

* export run ([#36](https://github.com/oclif/core/issues/36)) ([0a2fa9a](https://github.com/oclif/core/commit/0a2fa9a9e90baebd41d15f6b70a11f5ad75dc6c7))



## [0.1.1](https://github.com/oclif/core/compare/v0.1.0...v0.1.1) (2020-09-09)


### Bug Fixes

* accept integer 0 as valid arg input ([#34](https://github.com/oclif/core/issues/34)) ([36eb02f](https://github.com/oclif/core/commit/36eb02f168eaa179e260010443fd33e526a94763))
* support src/commands/index cmd ([#35](https://github.com/oclif/core/issues/35)) ([2c14c3c](https://github.com/oclif/core/commit/2c14c3c0987e9cf97ff1d34648cf4a0a90e595d2))



# 0.1.0 (2020-09-02)
