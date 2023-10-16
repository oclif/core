## [3.3.1](https://github.com/oclif/core/compare/3.3.0...3.3.1) (2023-10-16)


### Bug Fixes

* add frequency and frequencyUnit to warn-if-update ([#827](https://github.com/oclif/core/issues/827)) ([3567c74](https://github.com/oclif/core/commit/3567c748a8a04ab94cca493aa1dfcb4f10370f6e))



# [3.3.0](https://github.com/oclif/core/compare/3.2.1...3.3.0) (2023-10-16)



## [3.2.1](https://github.com/oclif/core/compare/3.2.0...3.2.1) (2023-10-13)


### Bug Fixes

* add types for warn-if-update-available ([#826](https://github.com/oclif/core/issues/826)) ([5464dcf](https://github.com/oclif/core/commit/5464dcf0933bd8afec26704662dfc5276ef07f47))



# [3.2.0](https://github.com/oclif/core/compare/3.1.0...3.2.0) (2023-10-13)


### Bug Fixes

* add Cache class for caching root plugin ([9452b19](https://github.com/oclif/core/commit/9452b191dafe64bd50bda116baa62c0b14552af3))
* bump ejs and other deps ([14a0e48](https://github.com/oclif/core/commit/14a0e48c5e9868bff9c28a640073966aa138528c))
* ignore .d.mts and .d.cts ([4ba853f](https://github.com/oclif/core/commit/4ba853fe51b0d0f623921ed025f61cf6665f66f3))
* support baseUrl for ts source ([03b824b](https://github.com/oclif/core/commit/03b824bdfc61810bc4e4ff89b21cccd3dfe0ebe4))


### Features

* support .mts and .cts file extensions ([5f16e0b](https://github.com/oclif/core/commit/5f16e0bd57f25b4f2d5f1fce70971c4538c54b1b))


### Performance Improvements

* promise.all flag and arg caching ([c592ce0](https://github.com/oclif/core/commit/c592ce0d1de21fc8624cac0240e22dc54a3f1f20))



# [3.1.0](https://github.com/oclif/core/compare/3.0.9...3.1.0) (2023-10-13)


### Features

* add hiddenAliases property to Command ([5bf0a2e](https://github.com/oclif/core/commit/5bf0a2e5ac08bee500543a379ba68251dc850574))
* add hideAliases help option ([f1925a7](https://github.com/oclif/core/commit/f1925a7136408a328dbfcf3146f8eb1fbd8d04a9))



## [3.0.9](https://github.com/oclif/core/compare/3.0.8...3.0.9) (2023-10-12)


### Bug Fixes

* remove tslib ([#825](https://github.com/oclif/core/issues/825)) ([5964ca6](https://github.com/oclif/core/commit/5964ca69afeb382a4fc4306737115d73f543b5a6))



## [3.0.8](https://github.com/oclif/core/compare/3.0.7...3.0.8) (2023-10-12)


### Bug Fixes

* **deps:** bump semver from 5.7.1 to 5.7.2 ([#808](https://github.com/oclif/core/issues/808)) ([cffa115](https://github.com/oclif/core/commit/cffa115b4e76b87911c33ac0ef9928ffe1cb4d6c))



## [3.0.7](https://github.com/oclif/core/compare/3.0.6...3.0.7) (2023-10-12)


### Bug Fixes

* use _flags for linked v2 plugins ([#820](https://github.com/oclif/core/issues/820)) ([cc63720](https://github.com/oclif/core/commit/cc63720aa90163d28dda9b5fb258ccc0556b6931))



## [3.0.6](https://github.com/oclif/core/compare/3.0.5...3.0.6) (2023-10-11)


### Bug Fixes

* warn about ts-node and node 20 ([#818](https://github.com/oclif/core/issues/818)) ([00ed4fe](https://github.com/oclif/core/commit/00ed4fe7a8e232ff23b3d6dc33e6f02335d69ffa))



## [3.0.5](https://github.com/oclif/core/compare/3.0.5-dev.0...3.0.5) (2023-10-11)



## [3.0.5-dev.0](https://github.com/oclif/core/compare/3.0.4...3.0.5-dev.0) (2023-10-10)


### Bug Fixes

* avoid fs.access for checking for file existence ([c4277a9](https://github.com/oclif/core/commit/c4277a984223eae89dabef36e9bee2ed565f3616))



## [3.0.4](https://github.com/oclif/core/compare/3.0.3...3.0.4) (2023-10-09)


### Bug Fixes

* custom flags with union type ([#813](https://github.com/oclif/core/issues/813)) ([a4afa23](https://github.com/oclif/core/commit/a4afa23983b7c164f4bf16f340e0dc4f584e8289))



## [3.0.3](https://github.com/oclif/core/compare/3.0.2...3.0.3) (2023-10-05)


### Bug Fixes

* only Command.Loadable in Help ([#811](https://github.com/oclif/core/issues/811)) ([bf9110e](https://github.com/oclif/core/commit/bf9110ed9e98cce1a6c1757e568a35b027b0d275))



## [3.0.2](https://github.com/oclif/core/compare/3.0.1...3.0.2) (2023-10-05)


### Bug Fixes

* dont run postrun hook for uinstalled plugins ([#805](https://github.com/oclif/core/issues/805)) ([0c47a5c](https://github.com/oclif/core/commit/0c47a5c17ac9b9fbc94d67fa46effbd96d877db0))



## [3.0.1](https://github.com/oclif/core/compare/3.0.0...3.0.1) (2023-10-05)


### Bug Fixes

* add macos to plugin PJSON interface ([2919835](https://github.com/oclif/core/commit/2919835703778800f993efb83a4ac63e1edd59e7))



# [3.0.0](https://github.com/oclif/core/compare/2.15.0...3.0.0) (2023-10-04)



# [2.15.0](https://github.com/oclif/core/compare/2.14.0...2.15.0) (2023-09-01)


### Features

* add PluginLoader class ([#774](https://github.com/oclif/core/issues/774)) ([b31665d](https://github.com/oclif/core/commit/b31665d809f9cbaddcad0905bec466ebc738fb79))



# [2.14.0](https://github.com/oclif/core/compare/2.13.0...2.14.0) (2023-08-31)


### Features

* **perf:** remove semver, fs-extra ([#762](https://github.com/oclif/core/issues/762)) ([fdab7b4](https://github.com/oclif/core/commit/fdab7b4f7cc798384c0af8d2bf25e3792da7fcc3))



# [2.13.0](https://github.com/oclif/core/compare/2.12.0...2.13.0) (2023-08-29)


### Features

* forwards compatibility for config reload ([#773](https://github.com/oclif/core/issues/773)) ([b751bbe](https://github.com/oclif/core/commit/b751bbecbbd25ebe56ef12f462f4f02e626e804b))



# [2.12.0](https://github.com/oclif/core/compare/2.11.11...2.12.0) (2023-08-28)


### Features

* reload Config before running command ([#770](https://github.com/oclif/core/issues/770)) ([efd1f54](https://github.com/oclif/core/commit/efd1f546079d5d0c9abe26df372ab657cfd389b0))



## [2.11.11](https://github.com/oclif/core/compare/2.11.10...2.11.11) (2023-08-28)


### Bug Fixes

* use configured help class in --help ([#768](https://github.com/oclif/core/issues/768)) ([b6c69f1](https://github.com/oclif/core/commit/b6c69f1f4f1760aee119ae660128ac45d59c828e))



## [2.11.10](https://github.com/oclif/core/compare/2.11.9...2.11.10) (2023-08-23)


### Bug Fixes

* add getPluginsList to Config interface ([cba7a75](https://github.com/oclif/core/commit/cba7a755cf5d0ff4886edd0db33d911441979984))



## [2.11.9](https://github.com/oclif/core/compare/2.11.8...2.11.9) (2023-08-23)


### Bug Fixes

* add getPluginsList ([b01083f](https://github.com/oclif/core/commit/b01083fb7132f3b3b35b98a6d43996b1713ca5ef))



## [2.11.8](https://github.com/oclif/core/compare/2.11.7...2.11.8) (2023-08-08)


### Bug Fixes

* handle lack of bin (happens in UT when stubbing config) ([#758](https://github.com/oclif/core/issues/758)) ([11e4f73](https://github.com/oclif/core/commit/11e4f73cf855f71294e4fc70c9d580c75bcef6e3))



## [2.11.7](https://github.com/oclif/core/compare/2.11.6...2.11.7) (2023-08-03)


### Bug Fixes

* allow CONTENT_TYPE env to work for all oclif cmds ([71db0dc](https://github.com/oclif/core/commit/71db0dc63ad5d4a43df72ac4a040df2d92d3b0e1))



## [2.11.6](https://github.com/oclif/core/compare/2.11.5...2.11.6) (2023-08-02)


### Bug Fixes

* add note to RequiredArgsError when there are flags with multiple=true ([#754](https://github.com/oclif/core/issues/754)) ([ed359a7](https://github.com/oclif/core/commit/ed359a72012b387c3d106be443be601f51a49225))



## [2.11.5](https://github.com/oclif/core/compare/2.11.4...2.11.5) (2023-07-31)


### Bug Fixes

* set moduleResolution to Node16 ([#750](https://github.com/oclif/core/issues/750)) ([d7fdda8](https://github.com/oclif/core/commit/d7fdda8d23a20892d36ada847cfdc24ae76ca4b1))



## [2.11.4](https://github.com/oclif/core/compare/2.11.3...2.11.4) (2023-07-31)


### Bug Fixes

* add missing properties to Interfaces.PJSON ([9b607f8](https://github.com/oclif/core/commit/9b607f881a78febc849e7307b9b896ee20abaf0e))



## [2.11.3](https://github.com/oclif/core/compare/2.11.2...2.11.3) (2023-07-31)


### Bug Fixes

* node 14 stdin logic ([9c88715](https://github.com/oclif/core/commit/9c88715454e061cf4c10aab00c22bd52957a9e4c))



## [2.11.2](https://github.com/oclif/core/compare/2.11.1...2.11.2) (2023-07-31)


### Bug Fixes

* node 14 stdin logic ([dfdea4e](https://github.com/oclif/core/commit/dfdea4ec237d847b3efdcd133c18f6ec0d5ee10b))



## [2.11.1](https://github.com/oclif/core/compare/2.11.0...2.11.1) (2023-07-28)


### Bug Fixes

* fall back to scopedEnvVarKey if scopedEnvVarKeys is not defined ([#752](https://github.com/oclif/core/issues/752)) ([cc63a56](https://github.com/oclif/core/commit/cc63a56766118237e26cab54ea806625cf0bd73c))



# [2.11.0](https://github.com/oclif/core/compare/2.10.1...2.11.0) (2023-07-28)


### Features

* deprecate scopedEnvVarKey for scopedEnvVarKeys which accounts for binAliases ([#751](https://github.com/oclif/core/issues/751)) ([4787248](https://github.com/oclif/core/commit/4787248655c39aaebb83eccd02bba3109921ccf7))



## [2.10.1](https://github.com/oclif/core/compare/2.10.0...2.10.1) (2023-07-28)


### Bug Fixes

* support node 14 again ([#741](https://github.com/oclif/core/issues/741)) ([a80c4fd](https://github.com/oclif/core/commit/a80c4fd74c7c5dc7b8426e6f78fc60689c82eab7))



# [2.10.0](https://github.com/oclif/core/compare/2.9.5...2.10.0) (2023-07-25)


### Features

* add extensions to esm checking ([#694](https://github.com/oclif/core/issues/694)) ([#743](https://github.com/oclif/core/issues/743)) ([427aa5b](https://github.com/oclif/core/commit/427aa5b877047bcd248bf1dbe0969c9bb0457e36))



## [2.9.5](https://github.com/oclif/core/compare/2.9.4...2.9.5) (2023-07-25)


### Bug Fixes

* corrected return type for Command.exit ([#715](https://github.com/oclif/core/issues/715)) ([#742](https://github.com/oclif/core/issues/742)) ([dd753f0](https://github.com/oclif/core/commit/dd753f045cde58d89b209e007926d4131f925570))



## [2.9.4](https://github.com/oclif/core/compare/2.9.3...2.9.4) (2023-07-18)


### Bug Fixes

* correctly print help when only command found and passed with help ([#733](https://github.com/oclif/core/issues/733)) ([3c3b597](https://github.com/oclif/core/commit/3c3b5973903b401dbd00a4005cb9d9d289289f76))



## [2.9.3](https://github.com/oclif/core/compare/2.9.2...2.9.3) (2023-07-13)



## [2.9.2](https://github.com/oclif/core/compare/2.9.1...2.9.2) (2023-07-13)


### Bug Fixes

* **parser:** don't throw if defaultHelp func throws ([#732](https://github.com/oclif/core/issues/732)) ([7003b40](https://github.com/oclif/core/commit/7003b403a3cb9f6fe54a87de843dbc058f96be6c))



## [2.9.1](https://github.com/oclif/core/compare/2.9.0...2.9.1) (2023-07-12)


### Bug Fixes

* flags omit undefined for boolean flags ([0a7e154](https://github.com/oclif/core/commit/0a7e15415f3514a4baad064478c76f0c17e9548a))



# [2.9.0](https://github.com/oclif/core/compare/2.8.12...2.9.0) (2023-07-11)


### Features

* perf benchmarks ([9734b9f](https://github.com/oclif/core/commit/9734b9f9bce5ededc92c52c4eb14663a9e998893))



## [2.8.12](https://github.com/oclif/core/compare/2.8.11...2.8.12) (2023-07-10)


### Bug Fixes

* properly truncate table cells that contain fullwidth characters or ANSI escape sequences ([db51bf2](https://github.com/oclif/core/commit/db51bf216b4b37d6c6e1d054e64b38dff0856d6d))



## [2.8.11](https://github.com/oclif/core/compare/2.8.10...2.8.11) (2023-07-01)


### Bug Fixes

* **deps:** bump semver and @types/semver ([fe9f09f](https://github.com/oclif/core/commit/fe9f09f9e9ac301ea25116deca42d394b46f6f3e))



## [2.8.10](https://github.com/oclif/core/compare/2.8.9...2.8.10) (2023-06-27)



## [2.8.9](https://github.com/oclif/core/compare/2.8.8...2.8.9) (2023-06-27)


### Bug Fixes

* revert flag validation problem ([11cbfd4](https://github.com/oclif/core/commit/11cbfd46f6f201a064205f5bb352bbd40efb150d))



## [2.8.8](https://github.com/oclif/core/compare/2.8.7...2.8.8) (2023-06-26)


### Bug Fixes

* improve flag validation ([ca9fe38](https://github.com/oclif/core/commit/ca9fe38c0531a4058483b5baf4b44946235e9ae0))



## [2.8.7](https://github.com/oclif/core/compare/2.8.6...2.8.7) (2023-06-15)


### Bug Fixes

* correctly load legacy plugins ([ec221d3](https://github.com/oclif/core/commit/ec221d30118f6c9d9b191aec4b25e648e4bb46f6))



## [2.8.6](https://github.com/oclif/core/compare/2.8.5...2.8.6) (2023-06-13)


### Bug Fixes

* don't override noTTYOutput ([809b9c0](https://github.com/oclif/core/commit/809b9c00244343a24b71be5eaefba0775bb270b5))



## [2.8.5](https://github.com/oclif/core/compare/2.8.4...2.8.5) (2023-05-03)


### Bug Fixes

* pass flag to default function ([#691](https://github.com/oclif/core/issues/691)) ([1cb7f26](https://github.com/oclif/core/commit/1cb7f26500b98080f35b8f914fef8441c6b07dbd))



## [2.8.4](https://github.com/oclif/core/compare/2.8.3...2.8.4) (2023-05-01)


### Bug Fixes

* expose nsisCustomization property on Config ([f0210cc](https://github.com/oclif/core/commit/f0210cccf4be171dedf1ac3ad7c54668df558865))



## [2.8.3](https://github.com/oclif/core/compare/2.8.2...2.8.3) (2023-05-01)


### Bug Fixes

* add nsisCustomization entry ([#695](https://github.com/oclif/core/issues/695)) ([a749c3b](https://github.com/oclif/core/commit/a749c3b2d23fa427431a5a20d82e3ada6a29b80d))



## [2.8.2](https://github.com/oclif/core/compare/2.8.1...2.8.2) (2023-04-12)


### Bug Fixes

*  jsonEnabled not handling after pass-through ([#687](https://github.com/oclif/core/issues/687)) ([5c7e534](https://github.com/oclif/core/commit/5c7e534229197d32ffc605f19394300c6ebdf8ac))



## [2.8.1](https://github.com/oclif/core/compare/2.8.0...2.8.1) (2023-04-11)


### Bug Fixes

* default help behaves properly ([#678](https://github.com/oclif/core/issues/678)) ([8562e13](https://github.com/oclif/core/commit/8562e13f76b8d8fee0ee7ef2ddfdba98a831e3e7))
* default help behaves properly ([#678](https://github.com/oclif/core/issues/678)) ([1d86cb0](https://github.com/oclif/core/commit/1d86cb0f3edcaa7f7bf09c779d7a307c320dcff2))



# [2.8.0](https://github.com/oclif/core/compare/2.7.1...2.8.0) (2023-03-28)


### Features

* feat: add new param isWritingManifest to Plugin.load ([#675](https://github.com/oclif/core/issues/675)) ([c452981](https://github.com/oclif/core/commit/c45298132860f83b4894d9db51e3e6f76d80d8f5))



## [2.7.1](https://github.com/oclif/core/compare/2.7.0...2.7.1) (2023-03-22)


### Reverts

* Revert "feat: add param noSensitiveData to Plugin.load (#665)" (#670) ([bdcbc87](https://github.com/oclif/core/commit/bdcbc8735c1c585029217215679da34608780f08)), closes [#665](https://github.com/oclif/core/issues/665) [#670](https://github.com/oclif/core/issues/670)



# [2.7.0](https://github.com/oclif/core/compare/2.6.5...2.7.0) (2023-03-22)


### Features

* add param noSensitiveData to Plugin.load ([#665](https://github.com/oclif/core/issues/665)) ([b4a738e](https://github.com/oclif/core/commit/b4a738e40735c40dbf633546011c4a860ebff46c))



## [2.6.5](https://github.com/oclif/core/compare/2.6.4...2.6.5) (2023-03-21)


### Bug Fixes

* add flag name and short char to deprecation message ([#664](https://github.com/oclif/core/issues/664)) ([79c41ca](https://github.com/oclif/core/commit/79c41cafe58a27f22b6f7c88e1126c5fd06cb7bb))



## [2.6.4](https://github.com/oclif/core/compare/2.6.3...2.6.4) (2023-03-16)


### Bug Fixes

* pass plugin type when resolving a module path ([#659](https://github.com/oclif/core/issues/659)) ([d5f58a3](https://github.com/oclif/core/commit/d5f58a342d27e381e45fbaa86fdd7983d531f197))



## [2.6.3](https://github.com/oclif/core/compare/2.6.2...2.6.3) (2023-03-13)


### Bug Fixes

* handle undefined env.SHELL ([#657](https://github.com/oclif/core/issues/657)) ([71fc49f](https://github.com/oclif/core/commit/71fc49fb84c217ced89c12e5ad86671c49e4c1aa))



## [2.6.2](https://github.com/oclif/core/compare/2.6.1...2.6.2) (2023-03-09)


### Bug Fixes

* add version details property to config interface ([#652](https://github.com/oclif/core/issues/652)) ([378095d](https://github.com/oclif/core/commit/378095d64413a673fc3d77598a46e4f14551dc16))



## [2.6.1](https://github.com/oclif/core/compare/2.6.0...2.6.1) (2023-03-09)


### Bug Fixes

* improve Performance class ([b263fc3](https://github.com/oclif/core/commit/b263fc38fccbf100a5fdf876f84eeb01afb7501a))



# [2.6.0](https://github.com/oclif/core/compare/2.5.2...2.6.0) (2023-03-09)


### Features

* add Config.versionDetails ([#651](https://github.com/oclif/core/issues/651)) ([ddddcd9](https://github.com/oclif/core/commit/ddddcd97913822dc3774b5b6250b7a0dbcfd4111))



## [2.5.2](https://github.com/oclif/core/compare/2.5.1...2.5.2) (2023-03-08)



## [2.5.1](https://github.com/oclif/core/compare/2.5.0...2.5.1) (2023-03-07)


### Bug Fixes

* stop any unstopped markers when collecting perf results ([#649](https://github.com/oclif/core/issues/649)) ([f8ab63e](https://github.com/oclif/core/commit/f8ab63e7b0efbda7454bb34e7ab5471f50cec6cf))



# [2.5.0](https://github.com/oclif/core/compare/2.4.0...2.5.0) (2023-03-06)


### Features

* add Performance class ([#641](https://github.com/oclif/core/issues/641)) ([c808189](https://github.com/oclif/core/commit/c8081890bcd73b382ba2eb03ae13ad6cfd6b1f17))



# [2.4.0](https://github.com/oclif/core/compare/2.3.2...2.4.0) (2023-02-28)


### Features

* add option to skip oclif error printing ([#642](https://github.com/oclif/core/issues/642)) ([ca88895](https://github.com/oclif/core/commit/ca88895bcfdca2d1c1ae5eda6e879ae6b1ac4122))



## [2.3.2](https://github.com/oclif/core/compare/2.3.1...2.3.2) (2023-02-28)


### Bug Fixes

* change useable ids to set to improve search perf ([#640](https://github.com/oclif/core/issues/640)) ([a0996a4](https://github.com/oclif/core/commit/a0996a4b3b5b1d69f2bb343c1c1ed2eef9e298b4))



## [2.3.1](https://github.com/oclif/core/compare/2.3.0...2.3.1) (2023-02-25)


### Bug Fixes

* **deps:** bump cli-progress from 3.11.2 to 3.12.0 ([f59977b](https://github.com/oclif/core/commit/f59977b4c5cf2281e71b0706aadda8403dabf0ce))



# [2.3.0](https://github.com/oclif/core/compare/2.2.1...2.3.0) (2023-02-21)


### Features

* add binAliases property to Config ([#632](https://github.com/oclif/core/issues/632)) ([9384f6e](https://github.com/oclif/core/commit/9384f6e6969765b45e5e2ed61dc45cf341af6182))



## [2.2.1](https://github.com/oclif/core/compare/2.2.0...2.2.1) (2023-02-20)


### Bug Fixes

* logToStderr actually logs to stderr ([efe2c50](https://github.com/oclif/core/commit/efe2c50524f653b99a7369ae2fc7b98993f008e3))



# [2.2.0](https://github.com/oclif/core/compare/2.1.7...2.2.0) (2023-02-20)


### Features

* wrap stdout and stderr ([#629](https://github.com/oclif/core/issues/629)) ([39ea8ea](https://github.com/oclif/core/commit/39ea8ea0a9fce781da9f0a51c9487de1603375b8))



## [2.1.7](https://github.com/oclif/core/compare/2.1.6...2.1.7) (2023-02-18)


### Bug Fixes

* **deps:** bump ejs and @types/ejs ([9192de0](https://github.com/oclif/core/commit/9192de0f43106c18eaf58c53152724f79b194f5a))



## [2.1.6](https://github.com/oclif/core/compare/2.1.5...2.1.6) (2023-02-17)


### Bug Fixes

* set prioritized command to alias ([#633](https://github.com/oclif/core/issues/633)) ([7d30350](https://github.com/oclif/core/commit/7d30350a2f68bf51772d1fe46e799c36258b3c30))



## [2.1.5](https://github.com/oclif/core/compare/2.1.4...2.1.5) (2023-02-16)


### Bug Fixes

* support legacy plugins ([#631](https://github.com/oclif/core/issues/631)) ([aff9e56](https://github.com/oclif/core/commit/aff9e562ca757e01ccc6589d200dcb1661b42486))



## [2.1.4](https://github.com/oclif/core/compare/2.1.3...2.1.4) (2023-02-13)


### Bug Fixes

* pass command instance to parse context ([#628](https://github.com/oclif/core/issues/628)) ([5641de5](https://github.com/oclif/core/commit/5641de51f9598e96cc1b3ca7794f9ca12eff3f04))



## [2.1.3](https://github.com/oclif/core/compare/2.1.2...2.1.3) (2023-02-13)


### Bug Fixes

* remove brackets for required args ([#619](https://github.com/oclif/core/issues/619)) ([d461fbf](https://github.com/oclif/core/commit/d461fbf751ad9492d4fffe00c8d301040a32318f))



## [2.1.2](https://github.com/oclif/core/compare/2.1.1...2.1.2) (2023-02-11)


### Bug Fixes

* **deps:** bump cli-progress from 3.10.0 to 3.11.2 ([4d15304](https://github.com/oclif/core/commit/4d1530424ce650286cf61c3836aa587d27f2a932))



## [2.1.1](https://github.com/oclif/core/compare/2.1.0...2.1.1) (2023-02-10)


### Bug Fixes

* config runHook interface ([#620](https://github.com/oclif/core/issues/620)) ([7180b4c](https://github.com/oclif/core/commit/7180b4cac824c3a1acadabe48c2bd1faeadeb7dd))



# [2.1.0](https://github.com/oclif/core/compare/2.0.11...2.1.0) (2023-02-10)


### Features

* add param to runHook to capture errors ([#617](https://github.com/oclif/core/issues/617)) ([7e7ca96](https://github.com/oclif/core/commit/7e7ca96259674b88cc7d5ff583182b5c1cad488a))



## [2.0.11](https://github.com/oclif/core/compare/2.0.10...2.0.11) (2023-02-08)


### Bug Fixes

* **deps:** bump tslib from 2.4.1 to 2.5.0 ([8924024](https://github.com/oclif/core/commit/89240244d079cb9800e155fe8feaf4d643c1f446))



## [2.0.10](https://github.com/oclif/core/compare/2.0.9...2.0.10) (2023-02-07)


### Bug Fixes

* handling quoted strings and options validation for comma-delimited multiple-flag ([#614](https://github.com/oclif/core/issues/614)) ([c32ab9d](https://github.com/oclif/core/commit/c32ab9ddd5b866bc9493b2dbe1f9dfc30492631f))



## [2.0.9](https://github.com/oclif/core/compare/2.0.8...2.0.9) (2023-02-06)


### Bug Fixes

* update Manifest type ([32716f5](https://github.com/oclif/core/commit/32716f562c21adc5a023628e43143c47a41c326e))



## [2.0.8](https://github.com/oclif/core/compare/2.0.7...2.0.8) (2023-01-31)


### Bug Fixes

* ignore hasDynamicHelp if JIT plugin ([#607](https://github.com/oclif/core/issues/607)) ([d280fa5](https://github.com/oclif/core/commit/d280fa5f1b392aba938db79de70523774e0c6440))



## [2.0.7](https://github.com/oclif/core/compare/2.0.6...2.0.7) (2023-01-26)


### Bug Fixes

* provide more context to flag and arg parsers ([cb29ca7](https://github.com/oclif/core/commit/cb29ca732928df8e4897e240380c9fa1d632758d))



## [2.0.6](https://github.com/oclif/core/compare/2.0.5...2.0.6) (2023-01-25)


### Bug Fixes

* flag type regressions ([57c755b](https://github.com/oclif/core/commit/57c755bb395d50aae8b513c277e181865a32df5c))



## [2.0.5](https://github.com/oclif/core/compare/2.0.4...2.0.5) (2023-01-25)


### Bug Fixes

* failed flag parsing error ([d3e975f](https://github.com/oclif/core/commit/d3e975f500f152f055f1e04855bb4485df687916))



## [2.0.4](https://github.com/oclif/core/compare/2.0.3...2.0.4) (2023-01-25)


### Bug Fixes

* allow negative num args ([#601](https://github.com/oclif/core/issues/601)) ([0540835](https://github.com/oclif/core/commit/05408357b149454ec127bc83d1b1502048c04500))



## [2.0.3](https://github.com/oclif/core/compare/1.26.0...2.0.3) (2023-01-23)


### Bug Fixes

* release v2 as latest ([5a9cb16](https://github.com/oclif/core/commit/5a9cb166c4a53961a66eb1e173a73cbad5f4b3e0))



# [1.26.0](https://github.com/oclif/core/compare/1.25.0...1.26.0) (2023-01-23)


### Features

* specify flag name in parse error message ([#589](https://github.com/oclif/core/issues/589)) ([#598](https://github.com/oclif/core/issues/598)) ([70dd894](https://github.com/oclif/core/commit/70dd89492c38c73771ef9c8498faf6e6da850cf1))



# [1.25.0](https://github.com/oclif/core/compare/1.24.3...1.25.0) (2023-01-19)


### Features

* support JIT plugin installation ([#533](https://github.com/oclif/core/issues/533)) ([d1abfbc](https://github.com/oclif/core/commit/d1abfbc40067f1b26f35b167cd33f3666ef69d9f))



## [1.24.3](https://github.com/oclif/core/compare/1.24.2...1.24.3) (2023-01-19)


### Bug Fixes

* support v2 style argument definitions ([#594](https://github.com/oclif/core/issues/594)) ([bba8f65](https://github.com/oclif/core/commit/bba8f65e2b6f7c8c5f1e53510865842773c46111))



## [1.24.2](https://github.com/oclif/core/compare/1.24.1...1.24.2) (2023-01-18)


### Bug Fixes

* forwards compatiblity ([3aea844](https://github.com/oclif/core/commit/3aea84417a5240249aaa0ec00b6e43744ae6d9c6))



## [1.24.1](https://github.com/oclif/core/compare/1.24.0...1.24.1) (2023-01-18)


### Bug Fixes

* allow deprecation.version to be number ([ef4ef9d](https://github.com/oclif/core/commit/ef4ef9dba5a9fab21b711fb71521b3acd0703c4e))



# [1.24.0](https://github.com/oclif/core/compare/1.23.2...1.24.0) (2023-01-11)


### Features

* add forwards compatibility for v2 args ([#587](https://github.com/oclif/core/issues/587)) ([9bc4a92](https://github.com/oclif/core/commit/9bc4a92bf4be90499ee0aa9cba74c8de54dd1b4b))



## [1.23.2](https://github.com/oclif/core/compare/1.23.1...1.23.2) (2023-01-08)


### Bug Fixes

* **deps:** bump @oclif/screen from 3.0.3 to 3.0.4 ([17abee3](https://github.com/oclif/core/commit/17abee3b9f2467b2e36244cfb05716b91434ce88))



## [1.23.1](https://github.com/oclif/core/compare/1.23.0...1.23.1) (2022-12-31)


### Bug Fixes

* **deps:** bump json5 from 2.2.0 to 2.2.2 ([406cf04](https://github.com/oclif/core/commit/406cf046f3dc2d197bc649cb09a479e85f17ad17))



# [1.23.0](https://github.com/oclif/core/compare/1.22.0...1.23.0) (2022-12-27)


### Features

* allow flags to have false value in when ([#557](https://github.com/oclif/core/issues/557)) ([c40ce71](https://github.com/oclif/core/commit/c40ce711471ec596d417bd1c146682cde1dfbf6f))



# [1.22.0](https://github.com/oclif/core/compare/1.21.0...1.22.0) (2022-12-16)


### Features

* pjson interface has devDependencies ([#574](https://github.com/oclif/core/issues/574)) ([4378886](https://github.com/oclif/core/commit/437888610b7bf2e4469d0a09d9bc0713dcec3fc5))



# [1.21.0](https://github.com/oclif/core/compare/1.20.4...1.21.0) (2022-12-06)


### Features

* handle custom parser nested array for multiple flag ([#568](https://github.com/oclif/core/issues/568)) ([046445c](https://github.com/oclif/core/commit/046445c463c28aaae84f2b0c2f0381b718ebaba7))



## [1.20.4](https://github.com/oclif/core/compare/1.20.3...1.20.4) (2022-11-06)


### Bug Fixes

* **deps:** bump tslib from 2.3.1 to 2.4.1 ([e2d4cd3](https://github.com/oclif/core/commit/e2d4cd3120639e6db66a3062039bee9149d8aa27))



## [1.20.3](https://github.com/oclif/core/compare/1.20.2...1.20.3) (2022-11-05)


### Bug Fixes

* **deps:** bump @oclif/screen from 3.0.2 to 3.0.3 ([154ed80](https://github.com/oclif/core/commit/154ed806bf7635d641e2b28f950be3c3f426f1e5))



## [1.20.2](https://github.com/oclif/core/compare/1.20.1...1.20.2) (2022-10-31)


### Bug Fixes

* **table:** use screen from @oclif/core ([#546](https://github.com/oclif/core/issues/546)) ([be3bea7](https://github.com/oclif/core/commit/be3bea7a19ba19793370ab83680361d5ae693d90))



## [1.20.1](https://github.com/oclif/core/compare/1.20.0...1.20.1) (2022-10-31)


### Bug Fixes

* OclifUX.ux.prompt() return type ([#538](https://github.com/oclif/core/issues/538)) ([1599edb](https://github.com/oclif/core/commit/1599edbe889a5fc213b9ae65f69e54fb17d796fc))



# [1.20.0](https://github.com/oclif/core/compare/1.19.2...1.20.0) (2022-10-28)


### Features

* warn about alias deprecations ([#540](https://github.com/oclif/core/issues/540)) ([aed5db3](https://github.com/oclif/core/commit/aed5db37efeb121dd4a0b0198adc9c23771feadf))



## [1.19.2](https://github.com/oclif/core/compare/1.19.1...1.19.2) (2022-10-25)


### Bug Fixes

* add missing prop to cached command ([#537](https://github.com/oclif/core/issues/537)) ([00b086c](https://github.com/oclif/core/commit/00b086ced707cf55ed40c387dc0a45f06fc68e46))



## [1.19.1](https://github.com/oclif/core/compare/1.19.0...1.19.1) (2022-10-19)


### Bug Fixes

* help flag ([#532](https://github.com/oclif/core/issues/532)) ([31d7045](https://github.com/oclif/core/commit/31d7045a50c058608c5dc92e1516eddbad383a3a))



# [1.19.0](https://github.com/oclif/core/compare/1.18.0...1.19.0) (2022-10-17)


### Features

* make flag deprecation warnings less noisy ([#527](https://github.com/oclif/core/issues/527)) ([a5fb337](https://github.com/oclif/core/commit/a5fb337b5e2ef32c03228535c8ec661e5cd6f96a))



# [1.18.0](https://github.com/oclif/core/compare/1.17.0...1.18.0) (2022-10-14)


### Features

* support flag and command deprecations ([#511](https://github.com/oclif/core/issues/511)) ([b0bf379](https://github.com/oclif/core/commit/b0bf379b5e8a681e9161d9492dae7b714ee48e88))



# [1.17.0](https://github.com/oclif/core/compare/1.16.7...1.17.0) (2022-10-14)


### Features

* support flag aliases ([#521](https://github.com/oclif/core/issues/521)) ([63f3e0e](https://github.com/oclif/core/commit/63f3e0ea14c360d977d1821e7ecd90642aeb1734))



## [1.16.7](https://github.com/oclif/core/compare/1.16.6...1.16.7) (2022-10-13)


### Bug Fixes

* **deps:** bump minimist from 1.2.5 to 1.2.7 ([3c987c2](https://github.com/oclif/core/commit/3c987c2866fd2716abb2aa5e4c0c0974caac9f61))



## [1.16.6](https://github.com/oclif/core/compare/1.16.5...1.16.6) (2022-10-12)


### Bug Fixes

* stop inserting extra line breaks in description ([#519](https://github.com/oclif/core/issues/519)) ([76aee62](https://github.com/oclif/core/commit/76aee62d32017d4455e477e0bf7cc26f4b0e03c3))



## [1.16.5](https://github.com/oclif/core/compare/v1.16.4...1.16.5) (2022-10-07)



## [1.16.4](https://github.com/oclif/core/compare/v1.16.3...v1.16.4) (2022-09-23)


### Bug Fixes

* work with 4.8.3 ([#493](https://github.com/oclif/core/issues/493)) ([2f09a72](https://github.com/oclif/core/commit/2f09a725bb7ff7ef8b4f4d6d6f67d0d83a1ed1f8))



## [1.16.3](https://github.com/oclif/core/compare/v1.16.2...v1.16.3) (2022-09-16)



## [1.16.2](https://github.com/oclif/core/compare/v1.16.1...v1.16.2) (2022-09-16)


### Bug Fixes

* throw if unexpected argument ([#491](https://github.com/oclif/core/issues/491)) ([da6d20c](https://github.com/oclif/core/commit/da6d20c388e48f65560822cee141d4f2fc5955a5))



## [1.16.1](https://github.com/oclif/core/compare/v1.16.0...v1.16.1) (2022-09-08)


### Bug Fixes

* support environment variables for boolean flags ([#488](https://github.com/oclif/core/issues/488)) ([#490](https://github.com/oclif/core/issues/490)) ([506945c](https://github.com/oclif/core/commit/506945c6ea2f8b75f0d56ad1f6e62a3717384a42)), closes [#487](https://github.com/oclif/core/issues/487)



# [1.16.0](https://github.com/oclif/core/compare/v1.15.0...v1.16.0) (2022-08-24)


### Features

* support complex flag relationships ([#468](https://github.com/oclif/core/issues/468)) ([222d1f6](https://github.com/oclif/core/commit/222d1f67012557ac0707077d6c8840966dbf00cb))



# [1.15.0](https://github.com/oclif/core/compare/v1.14.2...v1.15.0) (2022-08-23)


### Features

* add InferredFlags type ([#473](https://github.com/oclif/core/issues/473)) ([ee5ce65](https://github.com/oclif/core/commit/ee5ce651899c0ef586d425567ef3b78468dca627))



## [1.14.2](https://github.com/oclif/core/compare/v1.14.1...v1.14.2) (2022-08-18)


### Bug Fixes

* add overloads to enum flag ([799455b](https://github.com/oclif/core/commit/799455bbb526b221c806bf8feff6b625dcf50a56))



## [1.14.1](https://github.com/oclif/core/compare/v1.14.0...v1.14.1) (2022-08-16)


### Bug Fixes

* parser doesn't validate against options parameter if the value is provided through a env var ([#474](https://github.com/oclif/core/issues/474)) ([fe6dfea](https://github.com/oclif/core/commit/fe6dfea0bcc5cae69c91962430996670decf7887))



# [1.14.0](https://github.com/oclif/core/compare/v1.13.11...v1.14.0) (2022-08-16)


### Features

* all oclif flag types support custom parsers ([ad86faf](https://github.com/oclif/core/commit/ad86faf08f7a6d7984afe356819df458aaf04674))



## [1.13.11](https://github.com/oclif/core/compare/v1.13.10...v1.13.11) (2022-08-16)


### Bug Fixes

* more custom flag type overloads ([#471](https://github.com/oclif/core/issues/471)) ([ac4baf2](https://github.com/oclif/core/commit/ac4baf260f8e87bb5618c7b790f35372d55096c7))



## [1.13.10](https://github.com/oclif/core/compare/v1.13.9...v1.13.10) (2022-08-09)



## [1.13.9](https://github.com/oclif/core/compare/v1.13.8...v1.13.9) (2022-08-09)


### Bug Fixes

* remove json flag if subclass overrides enableJsonFlag ([#467](https://github.com/oclif/core/issues/467)) ([05dd12a](https://github.com/oclif/core/commit/05dd12ad114f37d0512df2d89a8e51d0984fa3d4))



## [1.13.8](https://github.com/oclif/core/compare/v1.13.7...v1.13.8) (2022-08-09)


### Bug Fixes

* revert [#460](https://github.com/oclif/core/issues/460) ([#466](https://github.com/oclif/core/issues/466)) ([4c28acf](https://github.com/oclif/core/commit/4c28acfc2131eadbac423fa722b8cc0dc16a1b5b))



## [1.13.7](https://github.com/oclif/core/compare/v1.13.6...v1.13.7) (2022-08-08)


### Bug Fixes

* types on custom flags ([#463](https://github.com/oclif/core/issues/463)) ([2728e23](https://github.com/oclif/core/commit/2728e2310406137e0356d039a90d321daafd6578))



## [1.13.6](https://github.com/oclif/core/compare/v1.13.5...v1.13.6) (2022-08-08)


### Bug Fixes

* flush not hitting drain condition ([#448](https://github.com/oclif/core/issues/448)) ([05dd5fe](https://github.com/oclif/core/commit/05dd5fe08b57aa716c07cc51e8ed407c9e7b6aa5))



## [1.13.5](https://github.com/oclif/core/compare/v1.13.4...v1.13.5) (2022-08-08)


### Bug Fixes

* skip loadDevPlugins ([#459](https://github.com/oclif/core/issues/459)) ([21c948c](https://github.com/oclif/core/commit/21c948cd41b08b3aad4df5c3439d33e235f6979e))



## [1.13.4](https://github.com/oclif/core/compare/v1.13.3...v1.13.4) (2022-08-08)


### Bug Fixes

* retain enable json flag get/set apply flag at parse ([#460](https://github.com/oclif/core/issues/460)) ([9812937](https://github.com/oclif/core/commit/9812937e43a573cf4a10d4b03fca47555de5a1d9))



## [1.13.3](https://github.com/oclif/core/compare/v1.13.2...v1.13.3) (2022-08-06)


### Bug Fixes

* improve flag types ([6d0b4e1](https://github.com/oclif/core/commit/6d0b4e1f1761baba0e085ea8d342a7bc913e7e5d))



## [1.13.2](https://github.com/oclif/core/compare/v1.13.1...v1.13.2) (2022-08-05)


### Bug Fixes

* flag types ([#454](https://github.com/oclif/core/issues/454)) ([2938ba4](https://github.com/oclif/core/commit/2938ba4082d1b0c603a55678fe47f5beed9acbb5))



## [1.13.1](https://github.com/oclif/core/compare/v1.13.0...v1.13.1) (2022-08-02)


### Bug Fixes

* throw appropriate error in runCommand ([#455](https://github.com/oclif/core/issues/455)) ([66e9bbc](https://github.com/oclif/core/commit/66e9bbca08f9e1f4a08e1c8c144bf85c274b7f82))



# [1.13.0](https://github.com/oclif/core/compare/v1.12.1...v1.13.0) (2022-07-28)


### Features

* drop node12, use es2020 ([ac749e3](https://github.com/oclif/core/commit/ac749e32917400386f0ee4056aa5b66a52f3d0e0))
* min/max for integer flag ([7e05ef7](https://github.com/oclif/core/commit/7e05ef7195269012055f30095552e61359fad47e))
* node14/es2020 for bigint, pr feedback ([03a50b8](https://github.com/oclif/core/commit/03a50b874a8e7ef621c23d846e63864e3850ee4a))



## [1.12.1](https://github.com/oclif/core/compare/v1.12.0...v1.12.1) (2022-07-21)


### Bug Fixes

* flag setter order ([#450](https://github.com/oclif/core/issues/450)) ([a02f86c](https://github.com/oclif/core/commit/a02f86cb1094a86ba0cd8689fd82908ff3d46386))



# [1.12.0](https://github.com/oclif/core/compare/v1.11.0...v1.12.0) (2022-07-20)


### Features

* improve the instantiation of global flags ([#445](https://github.com/oclif/core/issues/445)) ([d264535](https://github.com/oclif/core/commit/d2645358ccf1cddd0bb65d236e73ecf4c5ac7c0c))



# [1.11.0](https://github.com/oclif/core/compare/v1.10.0...v1.11.0) (2022-07-18)


### Features

* print error info when module not found ([#427](https://github.com/oclif/core/issues/427)) ([223e79b](https://github.com/oclif/core/commit/223e79b363ad01da327e264244daf23810849d70))



# [1.10.0](https://github.com/oclif/core/compare/v1.9.10...v1.10.0) (2022-07-15)


### Features

* add stderr method ([#441](https://github.com/oclif/core/issues/441)) ([d9490f7](https://github.com/oclif/core/commit/d9490f77ff4cac0ee9767f1386f18c7357e0666e))



## [1.9.10](https://github.com/oclif/core/compare/v1.9.9...v1.9.10) (2022-07-15)



## [1.9.9](https://github.com/oclif/core/compare/v1.9.8...v1.9.9) (2022-07-14)


### Bug Fixes

* help for single command CLIs ([#442](https://github.com/oclif/core/issues/442)) ([44aacc1](https://github.com/oclif/core/commit/44aacc12fbc68f9909796c4ad2a1c9d45f47e653))



## [1.9.8](https://github.com/oclif/core/compare/v1.9.7...v1.9.8) (2022-07-14)



## [1.9.7](https://github.com/oclif/core/compare/v1.9.6...v1.9.7) (2022-07-14)


### Bug Fixes

* can not find module 'cli-ux' ([#403](https://github.com/oclif/core/issues/403)) ([f16b67f](https://github.com/oclif/core/commit/f16b67f8b6cd3eaaf24c26d4e7c4d490c0937ff3))



## [1.9.6](https://github.com/oclif/core/compare/v1.9.5...v1.9.6) (2022-07-14)



## [1.9.5](https://github.com/oclif/core/compare/v1.9.4...v1.9.5) (2022-06-23)



## [1.9.4](https://github.com/oclif/core/compare/v1.9.3...v1.9.4) (2022-06-23)



## [1.9.3](https://github.com/oclif/core/compare/v1.9.2...v1.9.3) (2022-06-16)



## [1.9.2](https://github.com/oclif/core/compare/v1.9.1...v1.9.2) (2022-06-14)



## [1.9.1](https://github.com/oclif/core/compare/v1.9.0...v1.9.1) (2022-06-14)


### Bug Fixes

* support CLIs with single top level command ([#426](https://github.com/oclif/core/issues/426)) ([44adb4d](https://github.com/oclif/core/commit/44adb4d387695548a017b38249b0bc3453aedbdf))



# [1.9.0](https://github.com/oclif/core/compare/v1.8.2...v1.9.0) (2022-05-20)


### Features

* support TS directory imports for ESM ([#422](https://github.com/oclif/core/issues/422)) ([4c58e78](https://github.com/oclif/core/commit/4c58e782e86dd7ecf91294bac0d2c759b4454596))



## [1.8.2](https://github.com/oclif/core/compare/v1.8.1...v1.8.2) (2022-05-18)


### Bug Fixes

* properly load index.js ES modules (cont) ([#417](https://github.com/oclif/core/issues/417)) ([77ba8b8](https://github.com/oclif/core/commit/77ba8b891f941e371bacd0dbedb32be25d6d2599))



## [1.8.1](https://github.com/oclif/core/compare/v1.8.0...v1.8.1) (2022-05-10)


### Bug Fixes

* improve algo for collating command id ([#415](https://github.com/oclif/core/issues/415)) ([1a9bfdb](https://github.com/oclif/core/commit/1a9bfdb810e13506ed8fc4138cde1912981b97e3))



# [1.8.0](https://github.com/oclif/core/compare/v1.7.0...v1.8.0) (2022-05-06)


### Features

* improve Command interface ([#416](https://github.com/oclif/core/issues/416)) ([ed625e1](https://github.com/oclif/core/commit/ed625e1554a09e578e645ddd7aa2ddb1b368c03f))



# [1.7.0](https://github.com/oclif/core/compare/v1.6.4...v1.7.0) (2022-04-11)


### Features

* move console.log to single class method ([#400](https://github.com/oclif/core/issues/400)) ([2ccb274](https://github.com/oclif/core/commit/2ccb2740912dba3b81c4d36712fbb20fd6a03c23))



## [1.6.4](https://github.com/oclif/core/compare/v1.6.3...v1.6.4) (2022-03-31)


### Bug Fixes

* dynamic help ([#395](https://github.com/oclif/core/issues/395)) ([8ecc8f4](https://github.com/oclif/core/commit/8ecc8f41ec62ef5b05bdb70a79dce09b5913d14b))



## [1.6.3](https://github.com/oclif/core/compare/v1.6.2...v1.6.3) (2022-03-23)


### Bug Fixes

* use plugin alias if available ([245d841](https://github.com/oclif/core/commit/245d84197a64e55b17524c22cbc17ec025a07c08))



## [1.6.2](https://github.com/oclif/core/compare/v1.6.1...v1.6.2) (2022-03-23)


### Bug Fixes

* load correct plugin when using dynamic help ([#394](https://github.com/oclif/core/issues/394)) ([15c1fbe](https://github.com/oclif/core/commit/15c1fbe1e870b6da1372a5786a9ffb09746ce8f6))



## [1.6.1](https://github.com/oclif/core/compare/v1.6.0...v1.6.1) (2022-03-17)


### Bug Fixes

* set id to alias when adding commands ([#390](https://github.com/oclif/core/issues/390)) ([84ab722](https://github.com/oclif/core/commit/84ab7223a2196c6a33f64a3e4ba75a050b02d1c3))



# [1.6.0](https://github.com/oclif/core/compare/v1.5.3...v1.6.0) (2022-03-14)


### Features

* POC for allowing flexible command taxonomy ([#376](https://github.com/oclif/core/issues/376)) ([c47c6c6](https://github.com/oclif/core/commit/c47c6c6fb689a92f66d40aacfa146d885f08d962))



## [1.5.3](https://github.com/oclif/core/compare/v1.5.2...v1.5.3) (2022-03-09)


### Bug Fixes

* rid core of transient refs to cli-ux ([#379](https://github.com/oclif/core/issues/379)) ([a593a27](https://github.com/oclif/core/commit/a593a2751dbdd4bcd9cf05349154d0fa6e4d7e2d))



## [1.5.2](https://github.com/oclif/core/compare/v1.5.1...v1.5.2) (2022-03-04)


### Bug Fixes

* direct styled header text thru cliux.ux.info ([#387](https://github.com/oclif/core/issues/387)) ([5ebe8de](https://github.com/oclif/core/commit/5ebe8de3adcf2e45c952dd5aeaf5b2848b928e94))



## [1.5.1](https://github.com/oclif/core/compare/v1.5.0...v1.5.1) (2022-03-03)



# [1.5.0](https://github.com/oclif/core/compare/v1.4.0...v1.5.0) (2022-03-02)


### Features

* dir and file flags that validate existence and type ([#384](https://github.com/oclif/core/issues/384)) ([44dff41](https://github.com/oclif/core/commit/44dff41c5a3ffcdcbf2f10dcefb7c1ab233bfc4f))



# [1.4.0](https://github.com/oclif/core/compare/v1.3.6...v1.4.0) (2022-03-01)


### Features

* make global flags settable ([#385](https://github.com/oclif/core/issues/385)) ([e14061c](https://github.com/oclif/core/commit/e14061ca7e6a4c288eb50e0e9954b38e042682df))



## [1.3.6](https://github.com/oclif/core/compare/v1.3.5...v1.3.6) (2022-02-28)


### Bug Fixes

* parsing the default is wrong types ([ba08723](https://github.com/oclif/core/commit/ba087237773e6f4b3649d03dc88f693a22681de9))



## [1.3.5](https://github.com/oclif/core/compare/v1.3.4...v1.3.5) (2022-02-25)


### Bug Fixes

* print valid flag values in error message when using `exactlyOne` ([#349](https://github.com/oclif/core/issues/349)) ([ddcaeb2](https://github.com/oclif/core/commit/ddcaeb2f9b690d9b92dd0ac4937b6399f606adfa))



## [1.3.4](https://github.com/oclif/core/compare/v1.3.3...v1.3.4) (2022-02-11)


### Bug Fixes

* use error type instead of record ([#371](https://github.com/oclif/core/issues/371)) ([136ffe0](https://github.com/oclif/core/commit/136ffe06fe3dc3ddb6d018ced2b2cfaa9399d943))



## [1.3.3](https://github.com/oclif/core/compare/v1.3.2...v1.3.3) (2022-02-09)


### Bug Fixes

* update isProd utility ([#368](https://github.com/oclif/core/issues/368)) ([a58315d](https://github.com/oclif/core/commit/a58315dc401071675c0f1b08a7ab82c35846ce6d))



## [1.3.2](https://github.com/oclif/core/compare/v1.3.1...v1.3.2) (2022-02-08)


### Bug Fixes

* fix default import of lodash ([#366](https://github.com/oclif/core/issues/366)) ([99fc7d1](https://github.com/oclif/core/commit/99fc7d1fdddbcd1509f649723057cd0ba7ee414c))



## [1.3.1](https://github.com/oclif/core/compare/v1.3.0...v1.3.1) (2022-02-07)



# [1.3.0](https://github.com/oclif/core/compare/v1.2.1...v1.3.0) (2022-02-01)


### Features

* add S3Manifest ([#354](https://github.com/oclif/core/issues/354)) ([ea5585d](https://github.com/oclif/core/commit/ea5585db6361f12c3c0608b05d1e33e16bc0b4b6))



## [1.2.1](https://github.com/oclif/core/compare/v1.2.0...v1.2.1) (2022-01-28)


### Bug Fixes

* module resolution of linked plugins ([#352](https://github.com/oclif/core/issues/352)) ([c7f5d34](https://github.com/oclif/core/commit/c7f5d3439e7e60b6562362c87fe0d16a99a42a08))



# [1.2.0](https://github.com/oclif/core/compare/v1.1.2...v1.2.0) (2022-01-26)


### Features

* merge cli-ux library with oclif/core ([#345](https://github.com/oclif/core/issues/345)) ([27175d6](https://github.com/oclif/core/commit/27175d6f0693533b7cfbf57de65da626168d872f)), closes [npm/cli#4234](https://github.com/npm/cli/issues/4234)



## [1.1.2](https://github.com/oclif/core/compare/v1.1.1...v1.1.2) (2022-01-10)



## [1.1.1](https://github.com/oclif/core/compare/v1.1.0...v1.1.1) (2022-01-06)


### Bug Fixes

* regenerate yarn.lock ([#340](https://github.com/oclif/core/issues/340)) ([75bf208](https://github.com/oclif/core/commit/75bf20819f2af574004cb7fe698938b51c6f2e44))



# [1.1.0](https://github.com/oclif/core/compare/v1.0.11...v1.1.0) (2022-01-05)


### Features

* add integration tests ([#339](https://github.com/oclif/core/issues/339)) ([2159c0b](https://github.com/oclif/core/commit/2159c0b970a0090f8bf21ff59e63dea1e788b5f9))



## [1.0.11](https://github.com/oclif/core/compare/v1.0.10...v1.0.11) (2021-12-17)


### Bug Fixes

* update imports in errors/cli.ts ([#325](https://github.com/oclif/core/issues/325)) ([b3d6e9b](https://github.com/oclif/core/commit/b3d6e9bf34928ac59486807576a2ee2643b22464))



## [1.0.10](https://github.com/oclif/core/compare/v1.0.9...v1.0.10) (2021-12-08)


### Bug Fixes

* bump deps ([#317](https://github.com/oclif/core/issues/317)) ([3e656e0](https://github.com/oclif/core/commit/3e656e0b6909bedb879a267bf341cfb992f4d208))



## [1.0.9](https://github.com/oclif/core/compare/v1.0.8...v1.0.9) (2021-12-08)



## [1.0.8](https://github.com/oclif/core/compare/v1.0.7...v1.0.8) (2021-12-07)


### Bug Fixes

* bump deps ([#314](https://github.com/oclif/core/issues/314)) ([e989d1c](https://github.com/oclif/core/commit/e989d1c078d24df3023f2abf61dd454435f08956))



## [1.0.7](https://github.com/oclif/core/compare/v1.0.6...v1.0.7) (2021-12-02)


### Bug Fixes

* bump cli-ux ([2334c7d](https://github.com/oclif/core/commit/2334c7d05d003a167b41375d55cc67e28403863e))



## [1.0.6](https://github.com/oclif/core/compare/v1.0.5...v1.0.6) (2021-12-01)


### Bug Fixes

* bump cli-ux version in core ([#308](https://github.com/oclif/core/issues/308)) ([ea0a457](https://github.com/oclif/core/commit/ea0a45701981dbffaa0fbeab20f4fa678a75c4e0))



## [1.0.5](https://github.com/oclif/core/compare/v1.0.4...v1.0.5) (2021-12-01)


### Bug Fixes

* bump deps ([#306](https://github.com/oclif/core/issues/306)) ([52ee252](https://github.com/oclif/core/commit/52ee25247836b80d1d0c39f8f4793049a6ccbde7))



## [1.0.4](https://github.com/oclif/core/compare/v1.0.3...v1.0.4) (2021-11-18)


### Bug Fixes

* resolve typescript compilation errors ([#290](https://github.com/oclif/core/issues/290)) ([7079932](https://github.com/oclif/core/commit/70799324b19e36c3cff5618de49083c68d0d9fc6))



## [1.0.3](https://github.com/oclif/core/compare/v1.0.2...v1.0.3) (2021-11-08)


### Bug Fixes

* remove module lodash.template in favor of lodash ([#286](https://github.com/oclif/core/issues/286)) ([caaff0b](https://github.com/oclif/core/commit/caaff0b4918ab2e01bc01cad2c0d8158c2fcc1c5))



## [1.0.2](https://github.com/oclif/core/compare/v1.0.1...v1.0.2) (2021-10-13)


### Bug Fixes

* remove ability to enable json flag globally ([#272](https://github.com/oclif/core/issues/272)) ([3c754e7](https://github.com/oclif/core/commit/3c754e7eee04ef078ff4ab08849191e6a5779ee0))



## [1.0.1](https://github.com/oclif/core/compare/v1.0.0...v1.0.1) (2021-10-08)


### Bug Fixes

* use default separator if none is configured ([#271](https://github.com/oclif/core/issues/271)) ([602cf12](https://github.com/oclif/core/commit/602cf121ec676182a71a7e87b37714670cee0bf0))



# [1.0.0](https://github.com/oclif/core/compare/v0.6.0...v1.0.0) (2021-09-29)



# [0.6.0](https://github.com/oclif/core/compare/v0.5.41...v0.6.0) (2021-09-29)



## [0.5.41](https://github.com/oclif/core/compare/v0.5.40...v0.5.41) (2021-09-29)


### Bug Fixes

* only show warnings when json is not enabled ([#260](https://github.com/oclif/core/issues/260)) ([0890917](https://github.com/oclif/core/commit/0890917f79c671c4635dc577c6821d544eef3c69))



## [0.5.40](https://github.com/oclif/core/compare/v0.5.39...v0.5.40) (2021-09-27)


### Bug Fixes

* adjust help text to new style guide ([#259](https://github.com/oclif/core/issues/259)) ([28d9d78](https://github.com/oclif/core/commit/28d9d78f5118886632a200e51cb34f7896210304))



## [0.5.39](https://github.com/oclif/core/compare/v0.5.38...v0.5.39) (2021-09-17)


### Features

* parallelize runHook ([#253](https://github.com/oclif/core/issues/253)) ([34abf7c](https://github.com/oclif/core/commit/34abf7cd80f2f8825682ca782e42f62002215ebb))



## [0.5.38](https://github.com/oclif/core/compare/v0.5.37...v0.5.38) (2021-09-15)


### Features

* have --json global flag disabled by default ([#252](https://github.com/oclif/core/issues/252)) ([c2a7799](https://github.com/oclif/core/commit/c2a7799ce036697c77917a830a12bce5db6c68a7))



## [0.5.37](https://github.com/oclif/core/compare/v0.5.36...v0.5.37) (2021-09-15)


### Bug Fixes

* don't warn on hook errors ([#246](https://github.com/oclif/core/issues/246)) ([ba4be4b](https://github.com/oclif/core/commit/ba4be4b010f5f861e44b43ac31f33ce4b749982e))



## [0.5.36](https://github.com/oclif/core/compare/v0.5.35...v0.5.36) (2021-09-14)


### Bug Fixes

* move ctor for command help class to its own function ([#244](https://github.com/oclif/core/issues/244)) ([26f2445](https://github.com/oclif/core/commit/26f24457c71276c38f86821c2b1498ecb8e4e2a4))



## [0.5.35](https://github.com/oclif/core/compare/v0.5.34...v0.5.35) (2021-09-08)


### Bug Fixes

* clear hook timeout ([#243](https://github.com/oclif/core/issues/243)) ([0c32c65](https://github.com/oclif/core/commit/0c32c65c5c30b02bc3ea6e36b0598adfc5b23ec1))



## [0.5.34](https://github.com/oclif/core/compare/v0.5.33...v0.5.34) (2021-08-30)


### Bug Fixes

* add support all properties for a command class in manifest ([deb0765](https://github.com/oclif/core/commit/deb0765f81dbea54c831beba0b608b1a8cd0ecdb))



## [0.5.33](https://github.com/oclif/core/compare/v0.5.32...v0.5.33) (2021-08-30)


### Bug Fixes

* improve Hooks interface ([#234](https://github.com/oclif/core/issues/234)) ([32d0d62](https://github.com/oclif/core/commit/32d0d62ed30c65cdbca7c6da630b5542b38ab3b1))



## [0.5.32](https://github.com/oclif/core/compare/v0.5.31...v0.5.32) (2021-08-23)


### Bug Fixes

* account for aliases when converting spaced commands to commandID ([#232](https://github.com/oclif/core/issues/232)) ([b8ee9b2](https://github.com/oclif/core/commit/b8ee9b209ddacdf95f164a05473a05d1b6c53d6b))



## [0.5.31](https://github.com/oclif/core/compare/v0.5.30...v0.5.31) (2021-08-18)


### Bug Fixes

* command name parsing when flag=value present ([#231](https://github.com/oclif/core/issues/231)) ([6497514](https://github.com/oclif/core/commit/64975145085b6a9e287dd146a7fda8d3accfab58))



## [0.5.30](https://github.com/oclif/core/compare/v0.5.29...v0.5.30) (2021-08-16)


### Bug Fixes

* update collateSpacedCmdIDFromArgs ([#230](https://github.com/oclif/core/issues/230)) ([4687287](https://github.com/oclif/core/commit/46872871cb8c7e8749298344a575751638ab2c04))



## [0.5.29](https://github.com/oclif/core/compare/v0.5.28...v0.5.29) (2021-08-10)


### Bug Fixes

* don't put multiple newlines between flag summaries in help output ([#225](https://github.com/oclif/core/issues/225)) ([bfbd15c](https://github.com/oclif/core/commit/bfbd15c7c60f663b9a17f02d4f5a1e8798b4d613))
* switch ci to main ([849aeee](https://github.com/oclif/core/commit/849aeee378761f2edf52e7e9f44d4a0deab9cb3b))


### Features

* support multiple examples commands under a single description ([#229](https://github.com/oclif/core/issues/229)) ([b7ad583](https://github.com/oclif/core/commit/b7ad5838adcc2e3f274a563b302090b697afc96a))



## [0.5.28](https://github.com/oclif/core/compare/v0.5.27...v0.5.28) (2021-08-03)


### Features

* add state property ([#206](https://github.com/oclif/core/issues/206)) ([07f9092](https://github.com/oclif/core/commit/07f9092128f979e3e4e22aeee07bf4d4caa3024c))



## [0.5.27](https://github.com/oclif/core/compare/v0.5.26...v0.5.27) (2021-07-29)


### Bug Fixes

* restore short flags for --help and --version ([#205](https://github.com/oclif/core/issues/205)) ([67dadd4](https://github.com/oclif/core/commit/67dadd413dfbdd7742a3cd91e7ce1d5dfc7421da))



## [0.5.26](https://github.com/oclif/core/compare/v0.5.25...v0.5.26) (2021-07-22)


### Bug Fixes

* set exitCode on --json errors ([67f5eea](https://github.com/oclif/core/commit/67f5eea6e43345203ba7a79f5d27aeb65e7c2bab))



## [0.5.25](https://github.com/oclif/core/compare/v0.5.24...v0.5.25) (2021-07-22)


### Bug Fixes

* remove default flags ([403e5d8](https://github.com/oclif/core/commit/403e5d89351d2f9bc2494179e1514f0ed7500384))



## [0.5.24](https://github.com/oclif/core/compare/v0.5.23...v0.5.24) (2021-07-22)


### Bug Fixes

* set this.flags to empty object by default ([8f5d5ed](https://github.com/oclif/core/commit/8f5d5ed1f691ed442d88c19087bc50e0dadda88b))



## [0.5.23](https://github.com/oclif/core/compare/v0.5.22...v0.5.23) (2021-07-19)


### Bug Fixes

* make findCommand deterministic ([#204](https://github.com/oclif/core/issues/204)) ([3a37a8c](https://github.com/oclif/core/commit/3a37a8c7c5ab20da781a6682e41952b482622413))



## [0.5.22](https://github.com/oclif/core/compare/v0.5.21...v0.5.22) (2021-07-14)


### Bug Fixes

* respect variable args when using spaces ([#203](https://github.com/oclif/core/issues/203)) ([d458dfd](https://github.com/oclif/core/commit/d458dfd602bcdd8bfdf0ee920ff710a59b5d831a))



## [0.5.21](https://github.com/oclif/core/compare/v0.5.20...v0.5.21) (2021-07-07)


### Bug Fixes

* update cli-ux ([6608e12](https://github.com/oclif/core/commit/6608e12f488fa260ba952aa54ced780b1dfc4470))



## [0.5.20](https://github.com/oclif/core/compare/v0.5.19...v0.5.20) (2021-07-01)


### Bug Fixes

* allow for no args on top level topic ([1231eae](https://github.com/oclif/core/commit/1231eae78310d0da064ed74b53ad58e10e6905b6))



## [0.5.19](https://github.com/oclif/core/compare/v0.5.18...v0.5.19) (2021-06-30)


### Bug Fixes

* jsonEnabled when json is disabled ([4575be8](https://github.com/oclif/core/commit/4575be87f40622c13ed8060765d341365bc8bd6e))



## [0.5.18](https://github.com/oclif/core/compare/v0.5.17...v0.5.18) (2021-06-28)


### Features

* add docopts ([#188](https://github.com/oclif/core/issues/188)) ([4f38877](https://github.com/oclif/core/commit/4f38877b1e9abb1a19a3bcecde17945f80b2d52d))



## [0.5.17](https://github.com/oclif/core/compare/v0.5.16...v0.5.17) (2021-06-28)


### Bug Fixes

* simplify toSuccessJson ([442195e](https://github.com/oclif/core/commit/442195eb6ee5e7728fe0bb4e9e1d8ecb5633f105))



## [0.5.16](https://github.com/oclif/core/compare/v0.5.15...v0.5.16) (2021-06-28)


### Features

* return results from runHook ([#187](https://github.com/oclif/core/issues/187)) ([5355203](https://github.com/oclif/core/commit/535520326a354e3d12abc77ba9148a314fa957ba))



## [0.5.15](https://github.com/oclif/core/compare/v0.5.14...v0.5.15) (2021-06-24)


### Bug Fixes

* return type on toSuccessJson ([e2a9751](https://github.com/oclif/core/commit/e2a9751c84d5582ff4f0b3e24b12b198c0318dd1))



## [0.5.14](https://github.com/oclif/core/compare/v0.5.13...v0.5.14) (2021-06-17)


### Features

* help improvements and customizability ([#184](https://github.com/oclif/core/issues/184)) ([cb2109b](https://github.com/oclif/core/commit/cb2109b113864534ceb08978ae1b209be7ae70d8))



## [0.5.13](https://github.com/oclif/core/compare/v0.5.12...v0.5.13) (2021-06-09)



## [0.5.12](https://github.com/oclif/core/compare/v0.5.11...v0.5.12) (2021-06-07)



## [0.5.11](https://github.com/oclif/core/compare/v0.5.10...v0.5.11) (2021-06-07)



## [0.5.10](https://github.com/oclif/core/compare/v0.5.9...v0.5.10) (2021-05-28)



## [0.5.9](https://github.com/oclif/core/compare/v0.5.8...v0.5.9) (2021-05-27)



## [0.5.8](https://github.com/oclif/core/compare/v0.5.7...v0.5.8) (2021-05-26)


### Features

* strengthened ModuleLoader & unit tests; now supports mixed ESM / CJS plugins ([#163](https://github.com/oclif/core/issues/163)) ([788bf17](https://github.com/oclif/core/commit/788bf175b7e39b7d61fc07279e5cedca2fdbd540))



## [0.5.7](https://github.com/oclif/core/compare/v0.5.6...v0.5.7) (2021-05-17)


### Bug Fixes

* conversion of spaced commands to colon commands ([#164](https://github.com/oclif/core/issues/164)) ([9503d32](https://github.com/oclif/core/commit/9503d323d6e0dffe98a0a7005f676daeebd9ec44))



## [0.5.6](https://github.com/oclif/core/compare/v0.5.5...v0.5.6) (2021-05-13)


### Features

* integrate ESM loading of commands & hooks ([#160](https://github.com/oclif/core/issues/160)) ([ff47444](https://github.com/oclif/core/commit/ff47444b549566e40015d33f29d2687b74a980f4))



## [0.5.5](https://github.com/oclif/core/compare/v0.5.4...v0.5.5) (2021-04-26)



## [0.5.4](https://github.com/oclif/core/compare/v0.5.3...v0.5.4) (2021-04-20)



## [0.5.3](https://github.com/oclif/core/compare/v0.5.2...v0.5.3) (2021-04-19)



## [0.5.2](https://github.com/oclif/core/compare/v0.5.1...v0.5.2) (2021-04-19)



## [0.5.1](https://github.com/oclif/core/compare/v0.5.0...v0.5.1) (2021-04-15)


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



