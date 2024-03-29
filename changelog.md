## 1.1.0 (2023-03-17)

v.1.1.0 Stable Release

* Add support for customizing posthtml-parser #31
* Enable by default self-closing tag

## 1.0.0 (2023-03-14)

First Stable Release

* Fix error messages

## 1.0.0-RC.2 (2023-03-10)

Second Release Candidate

* Fix issue with custom valid attributes
* Added test for override options of valid attributes

## 1.0.0-RC.1 (2023-03-08)

First Release Candidate

* Prevent attributes used for passing props from being added to first node
* Updated docs

## 1.0.0-beta.16 (2022-11-06)

* Fix aware props propagation
* Add utility `isEnabled` to check if a prop is either `<div myprop>` or `<div myprop="true">`

## 1.0.0-beta.15 (2022-11-04)

* Fix aware props must be available only to nested components

## 1.0.0-beta.14 (2022-11-03)

* Fix node attributes not string

## 1.0.0-beta.13 (2022-11-03)

* Remove attributes that have "undefined" or "null" value

## 1.0.0-beta.12 (2022-10-31)

* Added more utilities

## 1.0.0-beta.11 (2022-10-30)

* Add new options to pass utilities methods to script like lodash `mergeWith` and `template`
* Allow to create a separated script file instead of `<script props>` inside component file
* Add options for set props object name passed to `<script props>`, props object name of `$slots` and props attribute name.

## 1.0.0-beta.10 (2022-10-28)

* Remove `computed:` and `merge:` by keeping this logic inside `<script props>`.

## 1.0.0-beta.9 (2022-10-26)

* Fix override class and style

## 1.0.0-beta.8 (2022-10-25)

* Fix merge locals with global

## 1.0.0-beta.7 (2022-10-25)

* Replace underscore with lodash
* Replace deepmerge with lodash method `mergeWith`
* Added merge customizer via options for lodash method `mergeWith`

## 1.0.0-beta.6 (2022-10-24)

* Fix `$slots` context

## 1.0.0-beta.5 (2022-10-24)

* 100% coverage test
* Fix components with same slot name in the same node 

## 1.0.0-beta.4 (2022-10-23)

* Refactor with underscore.js
* Optionally set attributes to any nodes not only the first one
* Added more docs

## 1.0.0-beta.3 (2022-10-21)

* Apply additional plugins to tree

## 1.0.0-beta.2 (2022-10-20)

* First beta release