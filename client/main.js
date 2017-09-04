

var { actions, stages, gradations } = data,
    fs = null, file

FileSystem.getInstance().then(f => fs = f).then(f => f.root.getFile('et.json')).then(fi => file = fi)

const OP_HTML = `<div>  
    <input value='保存' type='button' class='modify'/>
    <input value='添加' type='button' class='add'/>
    <input value='删除' type='button' class='delete'/>   
</div>`


class ETController {
    constructor(items, contentEl) {
        this.items = items

        this.contentEl = contentEl
        this.memuEl = contentEl && contentEl.querySelector('.left .item-menu')
        this.opEl = contentEl && contentEl.querySelector('.main>.op')
        this.editEl = contentEl && contentEl.querySelector('.main>.edit')
        this.rightMenuEl = contentEl && contentEl.querySelector('.right .item-menu')
    }

    render(contentEl) {
        if (!this.memuEl && !this.opEl && !this.editEl) {
            this.contentEl = contentEl
            this.memuEl = contentEl && contentEl.querySelector('.left .item-menu')
            this.opEl = contentEl && contentEl.querySelector('.main>.op')
            this.editEl = contentEl && contentEl.querySelector('.main>.edit')
            this.rightMenuEl = contentEl && contentEl.querySelector('.right .item-menu')
        }

        this.opEl.innerHTML = OP_HTML
        this.memuEl.innerHTML = '<ul></ul>'
        this.refresh()
        this.registerEvents()
    }



    refresh() {
        // 左边菜单
        let ul = this.memuEl.querySelector('ul')
        let htmlStr = ``
        htmlStr += this.items.map((item, index) =>
            `<li data-id='${item.id}' class='${index == 0 ? "active" : ""}'>${item.name}</li>`
        ).join('')
        ul.innerHTML = htmlStr

        // 右边内容区
        if (this.items && this.items.length > 0) {
            this.renderContent(this.items[0].id)
        } else {
            this._clearEdit()
        }
    }

    renderContent(id) {
        this.onRenderOperation(id)
        this.onRenderItem(id)
    }
    onRenderOperation(id) { }

    onRenderItem(id) { }

    registerEvents() {
        // 切换action
        let ul = this.memuEl.querySelector('ul')
        ul.addEventListener('click', ev => {
            let { target } = ev
            if (target.tagName === 'LI') {
                ul.querySelector('li.active').classList.remove('active')
                target.classList.add('active')
                this.renderContent(target.getAttribute('data-id'))
            }
        })

        this.opEl.querySelector('.modify').addEventListener('click', ev => {
            this.onSave()
            file.write(JSON.stringify(data))
        })

        this.opEl.querySelector('.add').addEventListener('click', ev => {
            this.onAdd()
        })

        this.opEl.querySelector('.delete').addEventListener('click', () => {
            this.delete()
        })
        this.onRegisterEvents()
    }

    onRegisterEvents() { }

    onSave() { }

    delete() {
        let id = this._getId(), index = this.items.findIndex(item => item.id == id)
        index > -1 && this.items.splice(index, 1)
        this.refresh()
    }

    onAdd() { }

    _getId(selector = '.item') {
        let el = this.contentEl.querySelector(selector)
        return el && el.getAttribute('data-id')
    }

    _clearEdit() {
        this.editEl.innerHTML = ''
    }
}

class ActionController extends ETController {
    constructor(actions) {
        //super(Object.keys(actions).reduce((pre, cur) => pre.concat(...actions[cur].map(a => (a.type = cur) && a)), []))
        super(actions)
    }

    onRenderItem(id) {
        let infoNode = this.opEl.querySelector('.info')
        infoNode && this.opEl.removeChild(infoNode)
        let action = this.items.find(ac => ac.id == id)
        if (!action)
            action = {}
        this.editEl.innerHTML = `<div data-id='${id}' contenteditable class='item'><code><pre>${action.instruction || ''}</pre></code></div>`
    }
    onSave() {
        let id = this._getId(),
            action = this.items.find(ac => ac.id == id)
        if (action) {
            action.instruction = this.editEl.querySelector('.item').innerText.trim()
        } else {
            action = {
                id: +new Date(),
                instruction: this.editEl.querySelector('.item').innerText.trim(),
                name: this.opEl.querySelector('[name=name]').value,
                type: this.opEl.querySelector('[name=type]').value
            }
            this.items.push(action)
            this.refresh()
        }
    }

    onAdd() {
        if (this.opEl.querySelector('[name=name]')) {
            return
        }
        let itemEl = this.editEl.querySelector('.item')
        if (itemEl) {
            itemEl.removeAttribute('data-id')
            this.editEl.querySelector('.item pre').innerText = ''
        } else {
            this.editEl.innerHTML = `<div data-id='' contenteditable class='item'><code><pre></pre></code></div>`
        }
        let preHtml = `
        <div>标题：<input name = 'name'/></div>
        <div>类别：       
            <select name='type'>
                <option value ="assign">assign</option>
                <option value ="api">api</option>
                <option value="assert">assert</option>               
            </select>
        </div>
        `
        let el = document.createElement('div')
        el.classList = 'info'
        el.innerHTML = preHtml
        this.opEl.appendChild(el)
    }
}

let contentEl = document.querySelector('.content')
let ac = new ActionController(actions)
ac.render(contentEl)

class StageController extends ETController {
    constructor(items, subItems, contentEl) {
        super(items, contentEl)
        this.subItems = subItems
    }

    disActions() {

        let ul = this.contentEl.querySelector('.right .item-menu')
        if (!actions) {
            this.subItems = null
            ul.innerHTML = ''
            return
        }
        // 左边菜单
        let htmlStr = `<ul >`
        htmlStr += this.subItems.map((item, index) =>
            `<li data-id='${item.id}' class='' draggable ='true'> ${item.name}</li>`
        ).join('')
        htmlStr += '</ul>'
        ul.innerHTML = htmlStr

        ul.addEventListener('dragstart', ev => {
            if (ev.target.tagName === 'LI') {
                ev.dataTransfer.setData('action', JSON.stringify(this.subItems.find(a => a.id == ev.target.getAttribute('data-id'))))
            }
        })
    }

    onRenderItem(id) {
        let infoNode = this.opEl.querySelector('.info')
        infoNode && this.opEl.removeChild(infoNode)
        let stage = this.items.find(ac => ac.id == id)
        if (!stage)
            stage = {}

        // 删除无效的action
        let _actions = [];
        (stage.actions || []).forEach(action => {
            var a = this.subItems.find(act => act.id == action)
            if (a) {
                _actions.push(a)
            }
        });
        stage.actions = _actions.map(a => a.id)


        this.editEl.innerHTML = _actions.map(action => {
            return `
            <div class='op-add'>+</div>   
            <div>
                <div class='action' title='${action.instruction}' data-id='${action.id}'>
                    <div class='action-type'>${action.type}</div>
                    <div class='action-name'>${action.name}</div>
                    <div class='action-op' data-id='${action.id}'>x</div>
                </div>     
            </div>      
           `
        }).concat(`<div class='op-add'>+</div>`).join('')

        if (stage) {
            this.editEl.setAttribute('data-id', id)
        }

        this.disActions()
    }

    onRegisterEvents() {
        if (this.registered) {
            return
        }
        this.editEl.addEventListener('click', ev => {
            // 删除
            let sid = null,
                el = ev.target, id = el.getAttribute('data-id')
            if (el.classList.contains('action-op')) {
                let preAddEl = el.parentElement.parentElement.previousSibling
                while (preAddEl.nodeName != 'DIV') {
                    preAddEl = preAddEl.previousSibling
                }
                this.editEl.removeChild(preAddEl)
                this.editEl.removeChild(el.parentElement.parentElement)
            }
        })


        this.editEl.addEventListener('dragover', ev => {
            ev.preventDefault();
            ev.stopPropagation();
        })

        this.editEl.addEventListener('drop', ev => {
            let el = ev.target
            if (el.classList.contains('op-add')) {
                let action = JSON.parse(ev.dataTransfer.getData('action'))
                el.parentElement.insertBefore(this.buildActionEl(action), el)
            }
        })



        this.registered = true
    }

    onSave() {
        let actionsEls = this.editEl.querySelectorAll('.action')
        if (!actionsEls) {
            alert('未添加任何action')
            return
        }
        let sid = this._getId(),
            stage = this.items.find(s => s.id == sid)

        if (stage) {
            stage.actions = [...actionsEls].map(el => el.getAttribute('data-id'))
        } else {
            stage = {
                name: this.opEl.querySelector('[name=name]').value.trim(),
                id: +new Date(),
                actions: [...actionsEls].map(el => el.getAttribute('data-id'))
            }
            this.items.push(stage)
        }
        this.refresh()
    }

    onAdd() {
        if (this.opEl.querySelector('[name=name]')) {
            return
        }
        let itemEl = this.editEl.querySelector('.item')
        this.editEl.removeAttribute('data-id')
        if (itemEl) {
            itemEl.removeAttribute('data-id')
            this.editEl.querySelector('.item pre').innerText = ''
        } else {

        }
        let preHtml = `
        <div>标题：<input name = 'name'/></div>        
        `
        let el = document.createElement('div')
        el.classList = 'info'
        el.innerHTML = preHtml
        this.opEl.appendChild(el)
    }

    buildActionEl(action) {
        let frag = document.createDocumentFragment()
        let el1, el2
        el1 = document.createElement('div')
        el1.innerHTML = '+'
        el1.classList = 'op-add'
        el2 = document.createElement('div')
        el2.alt = action.instruction
        el2.innerHTML = `
            <div class='action' title='${action.instruction}' data-id='${action.id}'>
                <div class='action-type'>${action.type}</div>
                <div class='action-name'>${action.name}</div>
                <div class='action-op' data-id='${action.id}'>x</div>
            </div>
        `
        frag.appendChild(el1)
        frag.appendChild(el2)
        return frag
    }

    _getId(selector = '.edit') {
        let el = this.contentEl.querySelector(selector)
        return el && el.getAttribute('data-id')
    }
}

let sc = new StageController(stages, ac.items, contentEl)


class GradationController extends ETController {
    constructor(items, subItems, contentEl) {
        super(items, contentEl)
        this.subItems = subItems
    }

    disStages() {

        let ul = this.contentEl.querySelector('.right .item-menu')
        // 左边菜单

        let htmlStr = `<ul >`
        htmlStr += this.subItems.map((item, index) =>
            `<li data-id='${item.id}' class='' draggable ='true'> ${item.name}</li>`
        ).join('')
        htmlStr += '</ul>'
        ul.innerHTML = htmlStr

        ul.addEventListener('dragstart', ev => {
            if (ev.target.tagName === 'LI') {
                ev.dataTransfer.setData('stage', JSON.stringify(this.subItems.find(a => a.id == ev.target.getAttribute('data-id'))))
            }
        })
    }

    onRenderItem(id) {
        let infoNode = this.opEl.querySelector('.info')
        infoNode && this.opEl.removeChild(infoNode)
        let grad = this.items.find(ac => ac.id == id)
        if (!grad)
            grad = {}

        // 删除无效的stg
        let _stages = [];
        (grad.stages || []).forEach(stage => {
            var a = this.subItems.find(st => st.id == stage)
            if (a) {
                _stages.push(a)
            }
        });
        grad.stages = _stages.map(a => a.id)
        this.editEl.innerHTML = _stages.map(stage => {
            return `
            <div class='op-add'>+</div>   
            <div>
                <div class='action' title='${stage.name}' data-id='${stage.id}'>                  
                    <div class='action-name'>${stage.name}</div>
                    <div class='action-op' data-id='${stage.id}'>x</div>
                </div>     
            </div>      
           `
        }).concat(`<div class='op-add'>+</div>`).join('')

        if (grad) {
            this.editEl.setAttribute('data-id', id)
        }

        this.disStages()
    }

    onRegisterEvents() {
        if (this.registered) {
            return
        }
        this.editEl.addEventListener('click', ev => {
            // 删除
            let sid = null,
                el = ev.target, id = el.getAttribute('data-id')
            if (el.classList.contains('action-op')) {
                let preAddEl = el.parentElement.parentElement.previousSibling
                while (preAddEl.nodeName != 'DIV') {
                    preAddEl = preAddEl.previousSibling
                }
                this.editEl.removeChild(preAddEl)
                this.editEl.removeChild(el.parentElement.parentElement)
            }
        })


        this.editEl.addEventListener('dragover', ev => {
            ev.preventDefault();
            ev.stopPropagation();
        })

        this.editEl.addEventListener('drop', ev => {
            let el = ev.target
            if (el.classList.contains('op-add')) {
                let stage = JSON.parse(ev.dataTransfer.getData('stage'))
                el.parentElement.insertBefore(this.buildActionEl(stage), el)
            }
        })



        this.registered = true
    }

    onSave() {
        let stagesEls = this.editEl.querySelectorAll('.action')
        if (!stagesEls) {
            alert('未添加任何stage')
            return
        }
        let sid = this._getId(),
            grad = this.items.find(s => s.id == sid)

        if (grad) {
            grad.stages = [...stagesEls].map(el => el.getAttribute('data-id'))
        } else {
            grad = {
                name: this.opEl.querySelector('[name=name]').value.trim(),
                id: +new Date(),
                stages: [...stagesEls].map(el => el.getAttribute('data-id'))
            }
            this.items.push(grad)
        }
        this.refresh()
    }

    onAdd() {
        if (this.opEl.querySelector('[name=name]')) {
            return
        }
        let itemEl = this.editEl.querySelector('.item')
        this.editEl.removeAttribute('data-id')
        if (itemEl) {
            itemEl.removeAttribute('data-id')
            this.editEl.querySelector('.item pre').innerText = ''
        } else {

        }
        let preHtml = `
        <div>标题：<input name = 'name'/></div>        
        `
        let el = document.createElement('div')
        el.classList = 'info'
        el.innerHTML = preHtml
        this.opEl.appendChild(el)
    }

    buildActionEl(item) {
        let frag = document.createDocumentFragment()
        let el1, el2
        el1 = document.createElement('div')
        el1.innerHTML = '+'
        el1.classList = 'op-add'
        el2 = document.createElement('div')
        el2.alt = item.name
        el2.innerHTML = `
            <div class='action' title='${item.name}' data-id='${item.id}'>               
                <div class='action-name'>${item.name}</div>
                <div class='action-op' data-id='${item.id}'>x</div>
            </div>
        `
        frag.appendChild(el1)
        frag.appendChild(el2)
        return frag
    }

    _getId(selector = '.edit') {
        let el = this.contentEl.querySelector(selector)
        return el && el.getAttribute('data-id')
    }
}

let gc = new GradationController(gradations, sc.items, contentEl)

class TopMenu {
    constructor(menus) {
        this.menus = menus
        this.el = null
    }
    render(el) {
        this.el = el
        let htmlStr = `<ul>`
        htmlStr += this.menus.map((menu, index) =>
            `<li data-id='${menu.id}' class='${index == 0 ? "active" : ""}'>${menu.name}</li>`
        ).join('')
        htmlStr += '</ul>'
        el.innerHTML = htmlStr
        this.registerEvents()
    }
    registerEvents() {
        let ul = this.el.querySelector('ul')
        ul.addEventListener('click', ev => {
            if (ev.target.tagName === 'LI') {
                ul.querySelector('li.active').classList.remove('active')
                ev.target.classList.add('active')
                switch (ev.target.getAttribute('data-id')) {
                    case "1":
                        ac.render()
                        sc.actions = null
                        break;
                    case "2":
                        sc.render()
                        break;
                    case "3":
                        gc.render()
                        break

                }
            }
        })
    }
}
const menus = [{ id: 1, name: 'Action' }, { id: 2, name: 'Stage' }, { id: 3, name: 'Gradation' }]
new TopMenu(menus).render(document.querySelector('.menu'))


