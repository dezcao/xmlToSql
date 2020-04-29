// xml_parser
// Hwang jae pil.
// https://github.com/nfarina/xmldoc#readme
// 배열을 받아서 처리하는 부분이 없다.
// include 안에서 또 include가 없다.
const fs = require('fs');
const xmldoc = require('xmldoc');
const path = require('path');

module.exports = {
	queryParser: async function(fileName, sqlId, queryParam) {
		let xmlNode = new xmldoc.XmlDocument(fs.readFileSync(path.join(__dirname, 'sql', fileName), 'utf8'));
		let XmlElement = xmlNode.descendantWithPath("query");
		let queryChildren = XmlElement.children;
		let targetChildren = null;

		for (let child of queryChildren) {
			if (child.attr && child.attr.id === sqlId) {
				targetChildren = child.children;
				break;
			}
		}

		return this._recurcive(targetChildren, queryParam, XmlElement);
	},

	_recurcive: function(queryElement, queryParam, XmlElement) {
		let query = '';
		for (let child of queryElement) {
			switch (child.name) {
				case 'if':
					query = query + this._if(child, queryParam);
					break;
				case 'choose':
					query =  query + this._choose(child, queryParam);
					break;
				case 'include':
					query = query + this._include(child, queryParam, XmlElement);
					break;
				case 'foreach':
					query = query + this._foreach(child, queryParam);
					break;
				default:
					query = query + (child.text ? child.text : '');
					break;
			}
		}
		query = query.trim();
		return query;
	},

	_getParamValue: function(keys, param) {
		try {
			for (let key of keys) {
				param = param[key];
			}
			return param;
		} catch (error) {
			console.log(error);
			return '';
		}

	},
	
	_dotValueMap: function(testCondition, queryParam) {
		let keyVal = {};
		let regexp = /(\w+\.)+\w+/g
		let array = [...testCondition.matchAll(regexp)];
		for (var matchResult of array) {
			let paramDepthKeys = matchResult[0].split('.');
			keyVal[matchResult[0]] = this._getParamValue(paramDepthKeys, queryParam);
		}
		return keyVal;
	},

	_testConditionBinder: function(testCondition, queryParam) {
		testCondition = testCondition.replace('and', '&&');
		testCondition = testCondition.replace('or', '||');
		
		// 1. [.] value binding
		let dotValueMap = this._dotValueMap(testCondition, queryParam);
		for (let key of Object.keys(dotValueMap)) {
			testCondition = testCondition.replace(key, isNaN(dotValueMap[key]) ? `'${dotValueMap[key]}'` : dotValueMap[key]);
		}
		
		// 2. key value binding : need to [.] value binding
		for (let key of Object.keys(queryParam)) {
			testCondition = testCondition.replace(key, isNaN(queryParam[key]) ? `'${queryParam[key]}'` : queryParam[key]);
		}

		return testCondition;
	},

	_if: function(child, queryParam) {
		let query = '';
		if (eval(this._testConditionBinder(child.attr.test, queryParam))) {
			query = query + this._recurcive(child.children, queryParam);
		}
		return query;
	},

	_choose: function(child, queryParam) {
		let query = '';
		let choosed = false;
		for (let choosen of child.children) {
			query = query + ' ' + (choosen.text ? choosen.text : '');
			if (!choosed && (choosen.name === 'when' || choosen.name === 'otherwise')) {
				if (choosen.attr.test && eval(this._testConditionBinder(choosen.attr.test, queryParam))) {
					query = query + ' ' + this._recurcive(choosen.children, queryParam);
					choosed = true;
				} else {
					query = query + ' ' + this._recurcive(choosen.children, queryParam);
				}
			}
		}
		
		return query;
	},

	_foreach: function(child, queryParam) {
		let {item = 'value', index:indexName, collection, open = '', separator = ',', close = ''} = child.attr;
		var query = '';
		
		if (!collection) {
			return query;
		}
		
		collectionValue = collection.includes('.') ? this._dotValueMap(collection, queryParam)[collection] : queryParam[collection];
		for (var i = 0 ; i < collectionValue.length; i++) {
			let children = child.children;
			for (var j = 0; j < children.length; j++) {
				if (children[j].text) {
					query = query + (children[j].text).trim();
				}
				if (children[j].children) {
					query = query + this._recurcive(children[j].children, { [item]: collectionValue[i] });  // node, paramObject
				}
			}
			
			let collectionItem = this._dotValueMap(query, { [item]: collectionValue[i] });
			for (let key of Object.keys(collectionItem)) {
				query = query.replace(key, isNaN(collectionItem[key]) ? `'${collectionItem[key]}'` : collectionItem[key]);
			}
			query = query + separator;
		}
		query = query.substr(0, query.length - 1);
		query = query.replace(/#{/g, '').replace(/}/g, '');
		if (open && close) {
			query = `${open}${query} ${close}`;
		}

		return query;
	},

	_convertArrayToObject: (array, key) => {
		const initialValue = {};
		return array.reduce((accumulator, currentValue) => {
			return {
				...accumulator,
				[currentValue.attr[key]]: currentValue,
			};
		}, initialValue);
	},

	_filterItem: (array, key, val) => {
		return array.filter(child => {
			return child[key] === val;
		});
	},

	_include: function(child, queryParam, XmlElement) {
		let query = '';
		let { refid = '' } = child.attr;
		// console.log(refid);
		let includeSqls = this._convertArrayToObject(this._filterItem(XmlElement.children, 'name', 'sql'), 'id');
		let properties = this._convertArrayToObject(this._filterItem(child.children, 'name', 'property'), 'name');
		for (let include of includeSqls[refid].children) {
			// console.log(include);
			if (include.text) {
				query = query + ' ' + (include.text ? include.text : '').trim();
				query = query.replace(/#{\s+/g, '#{').replace(/\${\s+/g, '${').replace(/\s+}/g, '}'); // space trim
				for (let propertyName of Object.keys(properties)) {
					query = query.replace('#{' + propertyName + '}', this._testConditionBinder(properties[propertyName].attr.value, queryParam));
					query = query.replace('${' + propertyName + '}', properties[propertyName].attr.value);
				}
			} else {
				query = query + ' ' + this._recurcive(include.children, queryParam);
			}
		}
		return query;
	}
}
