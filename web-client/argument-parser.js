const parseArgumentValue = (value, type, ret_value, subtype) => {
    switch(type) {
        case 'string':
            ret_value = '' + value;
            break;
        case 'int':
            ret_value = parseInt(value);
            break;
        case 'float':
            ret_value = parseFloat(value);
            break;
        case 'bool':
            if(('' + value).toLowerCase() in ['yes', 'true', '1'])
                ret_value = true;
            else if(('' + value).toLowerCase() in ['no', 'false', '0'])
                ret_value = false;
            else {
                console.error('Unknown bool literal: ', value);
                process.exit(-1);
            }
            break;
        case 'array':
            value = subtype ? parseArgumentValue(value, subtype) : value;

            if(ret_value)
                ret_value.push(value);
            else
                ret_value = value;
        default:
            console.error('Unknown preset argument type: ', this.type);
            process.exit(-1);
    }
    return ret_value;
};

const ArgumentParser = function() {

    const options = {};

    this.add_argument = (arg_opts) => {

        options[arg_opts.name] = arg_opts;
    };

    this.add_arguments = (args) => {

        for(let i in args)
            this.add_argument(args[i]);
    };

    this.parse_args = (args) => {

        console.debug('parse_args::args:', args);

        let opts = {};
        let current;
        for(let arg of args) {

            console.debug('arg:', arg);

            if(arg.startsWith('--')) {

                if(current) {

                    if(current.needValue()) {

                        console.debug(current.name, 'need value!');
                        process.exit(-1);
                    }
                    opts[current.name] = current.value;
                }

                current = {
                    name: arg.slice(2),
                    get type() { return options[this.name].type },
                    get value() {

                        if(this.hasOwnProperty('_value'))
                            return this._value;
                        if('store_true' === this.type)
                            return true;
                        else if('store_false' === this.type)
                            return false;
                    },
                    set value(value) {

                        this._value = parseArgumentValue(
                            value,
                            this.type,
                            this._value || undefined,
                            this.subtype || undefined,
                        );
                    },
                    needValue() {

                        if('store_true' === this.type)
                            return false;
                        if('store_false' === this.type)
                            return false;
                        return !this.hasOwnProperty('_value');
                    }
                };

                if(!options.hasOwnProperty(current.name)) {

                    console.error('Unknown argument', current.name);
                    process.exit(-1);
                }
            }
            else if(current)
                current.value = arg;
            else {

                console.error('Value is not prepend with argument: ', arg);
                process.exit(-1);
            }
        }

        if(current) {

            if(current.needValue()) {

                console.debug(current.name, 'need value!');
                process.exit(-1);
            }
            opts[current.name] = current.value;
        }

        return opts;
    };
}

module.exports = {
    ArgumentParser,
};
