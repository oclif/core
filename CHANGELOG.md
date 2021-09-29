# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.5.41](https://github.com/oclif/core/compare/v0.5.40...v0.5.41) (2021-09-29)


### Bug Fixes

* only show warnings when json is not enabled ([#260](https://github.com/oclif/core/issues/260)) ([0890917](https://github.com/oclif/core/commit/0890917f79c671c4635dc577c6821d544eef3c69))

### [0.5.40](https://github.com/oclif/core/compare/v0.5.39...v0.5.40) (2021-09-27)


### Bug Fixes

* adjust help text to new style guide ([#259](https://github.com/oclif/core/issues/259)) ([28d9d78](https://github.com/oclif/core/commit/28d9d78f5118886632a200e51cb34f7896210304))

### [0.5.39](https://github.com/oclif/core/compare/v0.5.38...v0.5.39) (2021-09-17)


### Features

* parallelize runHook ([#253](https://github.com/oclif/core/issues/253)) ([34abf7c](https://github.com/oclif/core/commit/34abf7cd80f2f8825682ca782e42f62002215ebb))

### [0.5.38](https://github.com/oclif/core/compare/v0.5.37...v0.5.38) (2021-09-15)


### Features

* have --json global flag disabled by default ([#252](https://github.com/oclif/core/issues/252)) ([c2a7799](https://github.com/oclif/core/commit/c2a7799ce036697c77917a830a12bce5db6c68a7))

### [0.5.37](https://github.com/oclif/core/compare/v0.5.36...v0.5.37) (2021-09-15)


### Bug Fixes

* don't warn on hook errors ([#246](https://github.com/oclif/core/issues/246)) ([ba4be4b](https://github.com/oclif/core/commit/ba4be4b010f5f861e44b43ac31f33ce4b749982e))

### [0.5.36](https://github.com/oclif/core/compare/v0.5.35...v0.5.36) (2021-09-14)


### Bug Fixes

* move ctor for command help class to its own function ([#244](https://github.com/oclif/core/issues/244)) ([26f2445](https://github.com/oclif/core/commit/26f24457c71276c38f86821c2b1498ecb8e4e2a4))

### [0.5.35](https://github.com/oclif/core/compare/v0.5.34...v0.5.35) (2021-09-08)


### Bug Fixes

* clear hook timeout ([#243](https://github.com/oclif/core/issues/243)) ([0c32c65](https://github.com/oclif/core/commit/0c32c65c5c30b02bc3ea6e36b0598adfc5b23ec1))

### [0.5.34](https://github.com/oclif/core/compare/v0.5.33...v0.5.34) (2021-08-30)


### Bug Fixes

* add support all properties for a command class in manifest ([deb0765](https://github.com/oclif/core/commit/deb0765f81dbea54c831beba0b608b1a8cd0ecdb))

### [0.5.33](https://github.com/oclif/core/compare/v0.5.32...v0.5.33) (2021-08-30)


### Bug Fixes

* improve Hooks interface ([#234](https://github.com/oclif/core/issues/234)) ([32d0d62](https://github.com/oclif/core/commit/32d0d62ed30c65cdbca7c6da630b5542b38ab3b1))

### [0.5.32](https://github.com/oclif/core/compare/v0.5.31...v0.5.32) (2021-08-23)


### Bug Fixes

* account for aliases when converting spaced commands to commandID ([#232](https://github.com/oclif/core/issues/232)) ([b8ee9b2](https://github.com/oclif/core/commit/b8ee9b209ddacdf95f164a05473a05d1b6c53d6b))

### [0.5.31](https://github.com/oclif/core/compare/v0.5.30...v0.5.31) (2021-08-18)


### Bug Fixes

* command name parsing when flag=value present ([#231](https://github.com/oclif/core/issues/231)) ([6497514](https://github.com/oclif/core/commit/64975145085b6a9e287dd146a7fda8d3accfab58))

### [0.5.30](https://github.com/oclif/core/compare/v0.5.29...v0.5.30) (2021-08-16)


### Bug Fixes

* update collateSpacedCmdIDFromArgs ([#230](https://github.com/oclif/core/issues/230)) ([4687287](https://github.com/oclif/core/commit/46872871cb8c7e8749298344a575751638ab2c04))

### [0.5.29](https://github.com/oclif/core/compare/v0.5.28...v0.5.29) (2021-08-10)


### Features

* support multiple examples commands under a single description ([#229](https://github.com/oclif/core/issues/229)) ([b7ad583](https://github.com/oclif/core/commit/b7ad5838adcc2e3f274a563b302090b697afc96a))


### Bug Fixes

* don't put multiple newlines between flag summaries in help output ([#225](https://github.com/oclif/core/issues/225)) ([bfbd15c](https://github.com/oclif/core/commit/bfbd15c7c60f663b9a17f02d4f5a1e8798b4d613))
* switch ci to main ([849aeee](https://github.com/oclif/core/commit/849aeee378761f2edf52e7e9f44d4a0deab9cb3b))

### [0.5.28](https://github.com/oclif/core/compare/v0.5.27...v0.5.28) (2021-08-03)


### Features

* add state property ([#206](https://github.com/oclif/core/issues/206)) ([07f9092](https://github.com/oclif/core/commit/07f9092128f979e3e4e22aeee07bf4d4caa3024c))

### [0.5.27](https://github.com/oclif/core/compare/v0.5.26...v0.5.27) (2021-07-29)


### Bug Fixes

* restore short flags for --help and --version ([#205](https://github.com/oclif/core/issues/205)) ([67dadd4](https://github.com/oclif/core/commit/67dadd413dfbdd7742a3cd91e7ce1d5dfc7421da))

### [0.5.26](https://github.com/oclif/core/compare/v0.5.25...v0.5.26) (2021-07-22)


### Bug Fixes

* set exitCode on --json errors ([67f5eea](https://github.com/oclif/core/commit/67f5eea6e43345203ba7a79f5d27aeb65e7c2bab))

### [0.5.25](https://github.com/oclif/core/compare/v0.5.24...v0.5.25) (2021-07-22)


### Bug Fixes

* remove default flags ([403e5d8](https://github.com/oclif/core/commit/403e5d89351d2f9bc2494179e1514f0ed7500384))

### [0.5.24](https://github.com/oclif/core/compare/v0.5.23...v0.5.24) (2021-07-22)


### Bug Fixes

* set this.flags to empty object by default ([8f5d5ed](https://github.com/oclif/core/commit/8f5d5ed1f691ed442d88c19087bc50e0dadda88b))

### [0.5.23](https://github.com/oclif/core/compare/v0.5.22...v0.5.23) (2021-07-19)


### Bug Fixes

* make findCommand deterministic ([#204](https://github.com/oclif/core/issues/204)) ([3a37a8c](https://github.com/oclif/core/commit/3a37a8c7c5ab20da781a6682e41952b482622413))

### [0.5.22](https://github.com/oclif/core/compare/v0.5.21...v0.5.22) (2021-07-14)


### Bug Fixes

* respect variable args when using spaces ([#203](https://github.com/oclif/core/issues/203)) ([d458dfd](https://github.com/oclif/core/commit/d458dfd602bcdd8bfdf0ee920ff710a59b5d831a))

### [0.5.21](https://github.com/oclif/core/compare/v0.5.20...v0.5.21) (2021-07-07)


### Bug Fixes

* update cli-ux ([6608e12](https://github.com/oclif/core/commit/6608e12f488fa260ba952aa54ced780b1dfc4470))

### [0.5.20](https://github.com/oclif/core/compare/v0.5.19...v0.5.20) (2021-07-01)


### Bug Fixes

* allow for no args on top level topic ([1231eae](https://github.com/oclif/core/commit/1231eae78310d0da064ed74b53ad58e10e6905b6))

### [0.5.19](https://github.com/oclif/core/compare/v0.5.18...v0.5.19) (2021-06-30)


### Bug Fixes

* jsonEnabled when json is disabled ([4575be8](https://github.com/oclif/core/commit/4575be87f40622c13ed8060765d341365bc8bd6e))

### [0.5.18](https://github.com/oclif/core/compare/v0.5.17...v0.5.18) (2021-06-28)


### Features

* add docopts ([#188](https://github.com/oclif/core/issues/188)) ([4f38877](https://github.com/oclif/core/commit/4f38877b1e9abb1a19a3bcecde17945f80b2d52d))

### [0.5.17](https://github.com/oclif/core/compare/v0.5.16...v0.5.17) (2021-06-28)


### Bug Fixes

* simplify toSuccessJson ([442195e](https://github.com/oclif/core/commit/442195eb6ee5e7728fe0bb4e9e1d8ecb5633f105))

### [0.5.16](https://github.com/oclif/core/compare/v0.5.15...v0.5.16) (2021-06-28)


### Features

* return results from runHook ([#187](https://github.com/oclif/core/issues/187)) ([5355203](https://github.com/oclif/core/commit/535520326a354e3d12abc77ba9148a314fa957ba))

### [0.5.15](https://github.com/oclif/core/compare/v0.5.14...v0.5.15) (2021-06-24)


### Bug Fixes

* return type on toSuccessJson ([e2a9751](https://github.com/oclif/core/commit/e2a9751c84d5582ff4f0b3e24b12b198c0318dd1))

### [0.5.14](https://github.com/oclif/core/compare/v0.5.13...v0.5.14) (2021-06-17)


### Features

* help improvements and customizability ([#184](https://github.com/oclif/core/issues/184)) ([cb2109b](https://github.com/oclif/core/commit/cb2109b113864534ceb08978ae1b209be7ae70d8))

### [0.5.13](https://github.com/oclif/core/compare/v0.5.12...v0.5.13) (2021-06-09)

### [0.5.12](https://github.com/oclif/core/compare/v0.5.11...v0.5.12) (2021-06-07)

### [0.5.11](https://github.com/oclif/core/compare/v0.5.10...v0.5.11) (2021-06-07)

### [0.5.10](https://github.com/oclif/core/compare/v0.5.9...v0.5.10) (2021-05-28)

### [0.5.9](https://github.com/oclif/core/compare/v0.5.8...v0.5.9) (2021-05-27)

### [0.5.8](https://github.com/oclif/core/compare/v0.5.7...v0.5.8) (2021-05-26)


### Features

* strengthened ModuleLoader & unit tests; now supports mixed ESM / CJS plugins ([#163](https://github.com/oclif/core/issues/163)) ([788bf17](https://github.com/oclif/core/commit/788bf175b7e39b7d61fc07279e5cedca2fdbd540))

### [0.5.7](https://github.com/oclif/core/compare/v0.5.6...v0.5.7) (2021-05-17)


### Bug Fixes

* conversion of spaced commands to colon commands ([#164](https://github.com/oclif/core/issues/164)) ([9503d32](https://github.com/oclif/core/commit/9503d323d6e0dffe98a0a7005f676daeebd9ec44))

### [0.5.6](https://github.com/oclif/core/compare/v0.5.5...v0.5.6) (2021-05-13)


### Features

* integrate ESM loading of commands & hooks ([#160](https://github.com/oclif/core/issues/160)) ([ff47444](https://github.com/oclif/core/commit/ff47444b549566e40015d33f29d2687b74a980f4))

### [0.5.5](https://github.com/oclif/core/compare/v0.5.4...v0.5.5) (2021-04-26)

### [0.5.4](https://github.com/oclif/core/compare/v0.5.3...v0.5.4) (2021-04-20)

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
