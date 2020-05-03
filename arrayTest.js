
let getParamValue = function(keyCondition, paramObject, objectCheck = true) {
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
	value = (typeof value === 'string' ? `'${value}'` : value);
	if (objectCheck && typeof value === 'object') {
		return value.length ? true : Object.keys(value).length ? true : false;
	}
	return value;
}

let iAmNotEval = function(str) {
	return new Function(`"use strict"; return ${str}`)();
}

let isParamKey = function (key) {
	key = key.trim();
	return isNaN(key) && !'&&||'.includes(key) && !key.startsWith(`'`) && !key.startsWith(`"`);
}

let param = {
	user_id: 'abc',
	user_name: 'abd',
	company: [
		{
			user_id: 1,
			name: 'home9'
		},
		{
			user_id: 2,
			name: 'work10'
		}
	],
	library: {
		lib_id: 'c1',
		name: 'chulsna'
	},
	xpath: true
};

let input = ` company and (    user_id!='abc' and user_id == user_name) 
	|| (company[1].user_id == '123' and xpath) and library.lib_id == 'aaa' `;
	input = input.replace(/\sand\s/g, ' && ').replace(/\sor\s/g, ' || '); // logical operator change

let key = '';
let output = '';
for (var i = 0; i < input.length; i++) {
	if (`(!= )`.includes(input.charAt(i))) {
		output += isParamKey(key) ? getParamValue(key, param) : key;
		key = ''; // key refresh
		output += input.charAt(i); // join (!= )
	} else {
		key += input.charAt(i);
	}
}
output += isParamKey(key) ? getParamValue(key, param) : key; // set last key, value
key = ''; // key refresh

console.log('++++++++++++++++++++++++++++');
console.log(input);
console.log(output);
console.log(iAmNotEval(output) ? true : false);