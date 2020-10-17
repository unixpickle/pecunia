class FilterEditorSection {
    constructor(name, fieldClass) {
        this.fieldClass = fieldClass;

        this.fields = [];
        this.element = document.createElement('div');
        this.element.className = 'filter-editor-section';

        this.title = document.createElement('h2');
        this.title.textContent = name;
        this.title.className = 'filter-editor-section-title';
        this.element.appendChild(this.title);

        this.addButton = document.createElement('button');
        this.addButton.textContent = 'Add';
        this.addButton.className = 'filter-editor-add-button';
        this.addButton.addEventListener('click', () => this.add());
        this.element.appendChild(this.addButton);
    }

    load(obj) {
        this.fields.forEach((f) => {
            this.element.removeChild(f.element);
        });
        this.fields = [];

        if (obj === null) {
            return;
        }
        obj.forEach((subObj) => {
            const field = new this.fieldClass();
            field.onDelete = (f) => this.deleteField(f);
            field.load(subObj);
            this.fields.push(field);
            this.element.appendChild(field.element);
        });
    }

    save() {
        return this.fields.map((f) => f.save());
    }

    add() {
        const field = new this.fieldClass();
        field.onDelete = (f) => this.deleteField(f);
        this.fields.push(field);
        this.element.appendChild(field.element);
    }

    deleteField(field) {
        this.element.removeChild(field.element);
        this.fields = this.fields.filter((x) => x !== field);
    }
}

class FilterEditorField {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'filter-editor-field';

        this.onDelete = () => null;
    }

    init() {
        this.createFields();
        this.createDeleteButton();
    }

    createFields() {
        // Override this method.
    }

    load(data) {
        // Override this method.
    }

    save() {
        // Override this method.
    }

    createDeleteButton() {
        this.deleteButton = document.createElement('button');
        this.deleteButton.className = 'filter-editor-delete-button';
        this.deleteButton.textContent = 'Delete';
        this.deleteButton.addEventListener('click', () => this.onDelete(this));
        this.element.appendChild(this.deleteButton);
    }
}

class FilterEditorInputField extends FilterEditorField {
    constructor(placeholders) {
        super();
        this.placeholders = placeholders;
        this.init();
    }

    createFields() {
        this.inputs = [];
        this.placeholders.forEach((ph) => {
            const inp = document.createElement('input');
            inp.placeholder = ph;
            this.inputs.push(inp);
            this.element.appendChild(inp);
        });
    }
}

class FieldEditorPatternField extends FilterEditorInputField {
    constructor() {
        super(['Regular expression to exclude']);
    }

    load(obj) {
        this.inputs[0].value = obj['Pattern'];
    }

    save() {
        return { 'Pattern': this.inputs[0].value };
    }
}

class FieldEditorCategoryField extends FilterEditorInputField {
    constructor() {
        super(['Regular expression', 'Category']);
    }

    load(obj) {
        this.inputs[0].value = obj['Pattern'];
        this.inputs[1].value = obj['Category'];
    }

    save() {
        return {
            'Pattern': this.inputs[0].value,
            'Category': this.inputs[1].value,
        };
    }
}

class FieldEditorReplaceField extends FilterEditorInputField {
    constructor() {
        super(['Regular expression', 'Replacement']);
    }

    load(obj) {
        this.inputs[0].value = obj['Pattern'];
        this.inputs[1].value = obj['Replacement'];
    }

    save() {
        return {
            'Pattern': this.inputs[0].value,
            'Replacement': this.inputs[1].value,
        };
    }
}
