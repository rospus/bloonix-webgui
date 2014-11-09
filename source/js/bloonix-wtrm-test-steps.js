var wtrmTestSteps = [ { "url" : "https://gui2.bloonix.de/public/html/wtrm-test.html", "action" : "doUrl" }, { "value" : "coffee", "action" : "doFill", "element" : "#id-input-1" }, { "value" : "beer", "action" : "doFill", "element" : ".class-input-2" }, { "value" : "cola", "action" : "doFill", "element" : "name-input-3" }, { "value" : "mate", "action" : "doFill", "element" : ".class-input-x" }, { "value" : "apple", "action" : "doFill", "element" : "#id-text-1" }, { "value" : "orange", "action" : "doFill", "element" : ".class-text-2" }, { "value" : "banana", "action" : "doFill", "element" : "name-text-3" }, { "value" : "cherry", "action" : "doFill", "element" : ".class-text-x" }, { "value" : 2, "action" : "doSelect", "element" : "#id-sel-1" }, { "value" : 3, "action" : "doSelect", "element" : ".class-sel-2" }, { "value" : "Bar", "action" : "doSelect", "element" : "name-sel-3" }, { "value" : 4, "action" : "doSelect", "element" : ".class-sel-x" }, { "action" : "doCheck", "element" : "#id-radio-1-1" }, { "action" : "doCheck", "element" : ".class-radio-2-2" }, { "value" : "Baz-3", "action" : "doCheck", "element" : "name-radio-3" }, { "action" : "doCheck", "element" : "#id-checkbox-4-1" }, { "action" : "doCheck", "element" : ".class-checkbox-5-2" }, { "value" : "Baz-6", "action" : "doCheck", "element" : "name-checkbox-6" }, { "action" : "doCheck", "element" : ".class-checkbox-x" }, { "action" : "doClick", "element" : "#button" }, { "action" : "doWaitForElement", "element" : "#input-added" }, { "value" : "It works!", "action" : "doFill", "element" : "#input-added" }, { "action" : "checkIfElementExists", "element" : "#id-input-1" }, { "action" : "checkIfElementNotExists", "element" : "#id-input-foo" }, { "action" : "checkIfElementExists", "element" : ".class-input-1" }, { "action" : "checkIfElementNotExists", "element" : ".class-input-foo" }, { "action" : "checkIfElementExists", "element" : "name-input-1" }, { "action" : "checkIfElementNotExists", "element" : "name-input-foo" }, { "text" : "Foo Bar Baz", "action" : "checkIfElementHasText", "element" : "#text" }, { "text" : "Foo Bar Baz", "action" : "checkIfElementHasText", "element" : "#html" }, { "html" : "Foo Bar Baz", "action" : "checkIfElementHasHTML", "element" : "#text" }, { "html" : "Foo <span>Bar</span> Baz", "action" : "checkIfElementHasHTML", "element" : "#html" }, { "text" : "FooBarBaz", "action" : "checkIfElementHasNotText", "element" : "#text" }, { "text" : "FooBarBaz", "action" : "checkIfElementHasNotText", "element" : "#html" }, { "html" : "FooBarBaz", "action" : "checkIfElementHasNotHTML", "element" : "#text" }, { "acceptError" : 1, "html" : "Foo <span>Bar</span> Baz", "action" : "checkIfElementHasNotHTML", "element" : "#html" }, { "value" : "coffee", "action" : "checkIfElementHasValue", "element" : "#id-input-1" }, { "value" : "beer", "action" : "checkIfElementHasValue", "element" : ".class-input-2" }, { "value" : "cola", "action" : "checkIfElementHasValue", "element" : "name-input-3" }, { "value" : "coffee-foo", "action" : "checkIfElementHasNotValue", "element" : "#id-input-1" }, { "value" : "beer-foo", "action" : "checkIfElementHasNotValue", "element" : ".class-input-2" }, { "acceptError" : 1, "value" : "cola", "action" : "checkIfElementHasNotValue", "element" : "name-input-3" }, { "action" : "checkIfElementIsChecked", "element" : "#id-radio-1-1" }, { "action" : "checkIfElementIsChecked", "element" : ".class-radio-2-2" }, { "value" : "Baz-3", "action" : "checkIfElementIsChecked", "element" : "name-radio-3" }, { "action" : "checkIfElementIsNotChecked", "element" : "#id-radio-1-2" }, { "action" : "checkIfElementIsNotChecked", "element" : ".class-radio-2-1" }, { "acceptError" : 1, "value" : "Baz-3", "action" : "checkIfElementIsNotChecked", "element" : "name-radio-3" }, { "value" : 2, "action" : "checkIfElementIsSelected", "element" : "#id-sel-1" }, { "value" : 3, "action" : "checkIfElementIsSelected", "element" : ".class-sel-2" }, { "value" : "Bar", "action" : "checkIfElementIsSelected", "element" : "name-sel-3" }, { "value" : 4, "action" : "checkIfElementIsSelected", "element" : ".class-sel-x" }, { "value" : "Baz", "action" : "checkIfElementIsNotSelected", "element" : "name-sel-3" }, { "acceptError" : 1, "value" : "Bar", "action" : "checkIfElementIsNotSelected", "element" : "name-sel-3" }, { "action" : "doSubmit", "element" : "#form" }, { "action" : "doWaitForElement", "element" : "#title" } ];
