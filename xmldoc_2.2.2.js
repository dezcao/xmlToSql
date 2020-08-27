// xml_parser
// Date : 2020.04.30
// Auther : Hwang jae pil.
// xmldoc : https://github.com/nfarina/xmldoc#readme
const fs = require('fs');
const xmldoc = require('xmldoc');
const path = require('path');

module.exports = {
	_getParamValue: function(keyCondition, paramObject, objectCheck = true) {
		if (keyCondition.startsWith(`'`) || keyCondition.startsWith(`"`)) {
			return keyCondition;
		}
		
		let keys = keyCondition.split('.');
		let value = paramObject;
		for (let key of keys) {
			if (key.includes('[')) {
				let preKey = key.substring(0, key.indexOf('['));
				let digit = key.substring(key.indexOf('[')+1, key.indexOf(']'));
				value = value[preKey][digit];
			} else {
				value = value[key];
			}
			if (!value) {
				break;
			}
		}
		
		if (value === null) {
			return value;
		}
		
		value = (typeof value === 'string' ? `'${value}'` : value);
		if (objectCheck && typeof value === 'object') {
			return value.length ? true : Object.keys(value).length ? true : false;
		}
		return value;
	},
	_testCondition: function(input, param) {
		return new Function(`"use strict"; return ${this._condition(input, param)}`)();
	},
	_setReturnObject: function (rs) {
		let keyString = true;
		if (`(!=)&| `.includes(rs.char)) {
			keyString = false;
		} else if (rs.char === `'` || rs.char === `"`) {
			keyString = true;
		} else if (!rs.key && !isNaN(parseInt(rs.char))) {
			keyString = false;
		}

		if (rs.char === ' ' && (rs.key.startsWith(`'`) || rs.key.startsWith(`"`))) {
			keyString = true;
		}
		
		if (keyString) {
			rs.key += rs.char;
		} else if (rs.key) {
			rs.output += this._getParamValue(rs.key, rs.param);
			rs.output += rs.char;
			rs.key = '';
		} else {
			rs.output += rs.char;
		}
		
		return rs;
	},
	_condition: function(input, param) {
		if (!input) {
			return input;
		}

		input = input.replace(/\sand\s/g, ' && ').replace(/\sor\s/g, ' || '); // logical operator change
		
		let i = 0;
		let boundary = input.length + 1;
		let rs = {
			input,
			output: '',
			char: '',
			key: '',
			joiningText: false,
			param: param
		};
		
		while(i < boundary) {
			rs.char = input.charAt(i);
			rs = this._setReturnObject(rs);
			i++;
		}

		return rs.output;
	},
	
	_recurcive: function(children, queryParam, XmlElement) {
		let query = '';
		for (let child of children) {
			switch (child.name) {
				case 'if':
					query = query + this._if(child, queryParam);
					break;
				case 'choose':
					query =  query + this._choose(child, queryParam);
					break;
				case 'foreach':
					query = query + this._foreach(child, queryParam);
					break;
				case 'include':
					query = query + this._include(child, queryParam, XmlElement);
					break;
				default:
					query = query + (child.text ? child.text : '');
					break;
			}
		}
		
		return query.trim();
	},

	queryParser: async function(fileName, sqlId, queryParam) {
		let xmlNode = new xmldoc.XmlDocument(fs.readFileSync(path.join(__dirname, 'sql', fileName), 'utf8'));
		let XmlElement = xmlNode.descendantWithPath("query");
		let queryChildren = XmlElement.children;
		let targetChildren = null;
		let i = 0;
		let length = queryChildren.length;
		while(i < length) {
			if (queryChildren[i].attr && queryChildren[i].attr.id === sqlId) {
				targetChildren = queryChildren[i].children;
				break;
			}
			i++;
		}
		return targetChildren ? this._recurcive(targetChildren, queryParam, XmlElement) : `sqlId : [ ${sqlId} ] not found.`;
	},

	_if: function(child, queryParam) {
		return this._testCondition(child.attr.test, queryParam) ? this._recurcive(child.children, queryParam) : ''
	},

	_choose: function(child, queryParam) {
		let query = '';
		let i = 0;
		let length = child.children.length;
		while(i < length) {
			let choosen = child.children[i];
			i++;

			if (choosen.text) {
				query = query + ' ' + choosen.text;
				continue;
			}

			if (choosen.name === 'when' && this._testCondition(choosen.attr.test, queryParam)) {
				query = query + ' ' + this._recurcive(choosen.children, queryParam);
				break;
			}

			if (choosen.name === 'otherwise') {
				query = query + ' ' + this._recurcive(choosen.children, queryParam);
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
		
		collectionValue = this._getParamValue(collection, queryParam, false);
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

			query = query.replace(/\#\{\s+/g, '#{').replace(/\s+\}/g, '}'); // remove space
			let array = [...query.matchAll(/\#\{((?!\#\{).)*\}/g)]; // #{item.parttern....}
			for (var matchResult of array) {
				let matchVal = this._getParamValue(matchResult[0].replace(/\#\{/g, '').replace(/\}/g, ''), { [item]: collectionValue[i] }, false);
				query = query.replace(matchResult[0], matchVal);
			}
			
			query = query + separator;
		}

		query = query.substr(0, query.length - 1);
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
		let includeSqls = this._convertArrayToObject(this._filterItem(XmlElement.children, 'name', 'sql'), 'id');
		let properties = this._convertArrayToObject(this._filterItem(child.children, 'name', 'property'), 'name');
		for (let include of includeSqls[refid].children) {
			if (include.text) {
				query = query + ' ' + (include.text ? include.text : '').trim();
				query = query.replace(/#{\s+/g, '#{').replace(/\${\s+/g, '${').replace(/\s+}/g, '}'); // space trim
				for (let propertyName of Object.keys(properties)) {
					// #{value} => 'value'
					query = query.replace('#{' + propertyName + '}', this._getParamValue(properties[propertyName].attr.value, queryParam, false));

					// ${value} => value
					query = query.replace('${' + propertyName + '}', properties[propertyName].attr.value);
				}
			} else {
				if (include.name === 'include') {
					query = query + ' ' + this._recurcive([include], queryParam, XmlElement);
				} else {
					query = query + ' ' + this._recurcive(include.children, queryParam);
				}
			}
		}
		return query;
	}
}
