// RNG from https://stackoverflow.com/a/47593316
function cyrb128(str) { // String hashing
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
    return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
}

function sfc32(a, b, c, d) {
    return function() {
      a |= 0; b |= 0; c |= 0; d |= 0;
      var t = (a + b | 0) + d | 0;
      d = d + 1 | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
}

const date_string = new Date().toDateString();
var seed = cyrb128(date_string);
var rand = sfc32(seed[0], seed[1], seed[2], seed[3]);

// CLASSES
class OptionChoice {
    constructor(optionChance, value) {
        this.chance = optionChance;
        this.value = value;
    }

    static fromArr(arr) {
        return new OptionChoice(arr[0], arr[1])
    }
}

class Category {
    constructor(category_name, unit, options) {
        this.category_name = category_name;
        this.unit = unit;
        this.options = options;
        this.current = null;
        this.numeric_category = unit !== null;
        this.index = null;
        this.manager = null;
    }

    addOption(option) {
        this.options.push(option)
    }

    selectRandom() {
        var total = 0;
        this.options.forEach(option => {
            total = total + option.chance;
        })
        var r = rand();
        var cur_amount = 0;
        var result = null;
        this.options.forEach(option => {
            if (result === null) {
                cur_amount = cur_amount + option.chance;
                if (cur_amount / total >= r) {
                    result = option;
                }
            }
        })
        this.current = result;
        return result;
    }

    generateElement(index, debt_value, complete) {
        const singular = document.createElement("div");
        singular.className = "draws_singular";

        const box = document.createElement("div");
        box.className = `draws_box box_${index}`

        const action = document.createElement("p");
        action.className = "draws_action";
        if (this.current.value === null) {
            action.innerHTML = "Nothing"
        } else if (this.numeric_category) {
            action.innerHTML = `${this.category_name} ${this.current.value}${this.unit}`
        } else {
            action.innerHTML = `${this.current.value}`
        }

        const checkLink = document.createElement("a");
        const checkbox = document.createElement("span");
        if (complete) {
            checkbox.className = "draws_checkbox inactive material-symbols-outlined";
            checkbox.innerHTML = "check_box";
        } else {
            checkbox.className = "draws_checkbox material-symbols-outlined";
            checkbox.innerHTML = "check_box_outline_blank";
        }
        checkLink.onclick = () => this.ToggleComplete(checkbox);

        checkLink.appendChild(checkbox);
        box.appendChild(action);
        box.appendChild(checkLink);
        singular.appendChild(box);

        const extra = document.createElement("div");
        extra.className = `draws_extra box_${index}`;

        if (this.numeric_category) {
            const debt = document.createElement("span");
            debt.className = "draws_debt";
            debt.innerHTML = `${debt_value}${this.unit}`;

            const timerLink = document.createElement("a");
            const timer = document.createElement("span");
            if (debt_value !== 0) {
                timer.className = "draws_timer material-symbols-outlined";
            } else {
                timer.className = "draws_timer inactive material-symbols-outlined";
            }
            timer.innerHTML = "timer";
            timerLink.appendChild(timer);

            extra.appendChild(debt);
            extra.appendChild(timerLink);

            timerLink.onclick = () => {
                const timeModal = document.getElementById("timeModal");
                const timeSet = document.getElementById("timeSetButton");
                const timeInput = document.getElementById("timeInput");

                timeModal.style.display = "block";

                timeSet.onclick = () => {
                    this.LogDebt(timeInput.value, debt, timer);

                    timeModal.style.display = "none";
                    timeModal.onclick = null;
                }
            }
        } else {
            const debt = document.createElement("span");
            debt.className = "draws_debt";
            debt.innerHTML = `${debt_value.length}`

            const cardsLink = document.createElement("a");
            const cards = document.createElement("span");
            if (debt_value.length !== 0) {
                cards.className = "draws_cards material-symbols-outlined";
            } else {
                cards.className = "draws_cards inactive material-symbols-outlined";
            }
            cards.innerHTML = "web_stories";

            cardsLink.appendChild(cards);
            extra.appendChild(debt);
            extra.appendChild(cardsLink);

            cardsLink.onclick = () => {
                this.showCardsModal(debt, cards);
            }
        }

        singular.appendChild(extra);

        return singular;

    }

    showCardsModal(debt, cards) {
        const cardsModal = document.getElementById("cardsModal");
        const cardsModalContainer = document.getElementById("cardsModalContainer");

        cardsModal.style.display = "block";

        while (cardsModalContainer.children.length > 0) {
            cardsModalContainer.removeChild(cardsModalContainer.children[0]);
        }

        this.debt_value.forEach((option, index2) => {
            const singular_option = document.createElement("div");
            singular_option.className = "draws_singular";

            const box_option = document.createElement("div");
            box_option.className = `draws_box box_${this.index+1}`

            const action_option = document.createElement("p");
            action_option.className = "draws_action";
            if (option.value === null) {
                action_option.innerHTML = "Nothing"
            } else if (this.numeric_category) {
                action_option.innerHTML = `${this.category_name} ${option.value}${this.unit}`
            } else {
                action_option.innerHTML = `${option.value}`
            }

            const checkLink_option = document.createElement("a");
            const checkbox_option = document.createElement("span");
            checkbox_option.className = "draws_checkbox material-symbols-outlined";
            checkbox_option.innerHTML = "check_box_outline_blank";

            checkLink_option.appendChild(checkbox_option);
            box_option.appendChild(action_option);
            box_option.appendChild(checkLink_option);
            singular_option.appendChild(box_option);

            cardsModalContainer.appendChild(singular_option);

            checkLink_option.onclick = () => {
                this.CompleteCard(index2, debt, cards);
            }
        })
    }

    ToggleComplete(elem) {
        var setval;
        if (elem.classList.contains("inactive")) {
            elem.classList.remove("inactive");
            elem.innerHTML = "check_box_outline_blank";
            setval = false;
        }
        else {
            elem.classList.add("inactive");
            elem.innerHTML = "check_box";
            setval = true;
        }
        this.manager.setCompleted(this.index, setval);
    }

    LogDebt(amount, debt, timer) {
        this.debt_value = this.debt_value - amount;
        debt.innerHTML = `${this.debt_value}${this.unit}`;

        this.manager.reduceDebt(this.index, amount);

        if (this.debt_value === 0) {
            timer.classList.add("inactive");
        }
    }

    CompleteCard(card_index, debt, cards) {
        this.manager.completeCard(this.index, card_index);

        debt.innerHTML = `${this.debt_value.length}`

        if (this.debt_value.length === 0) {
            cards.classList.add("inactive");
        }

        this.showCardsModal(debt, cards);
    }
}

class CategoryManager {
    constructor(categories, debts, complete, currentDay) {
        const self = this;
        this.categories = categories;
        this.categories.map((cat, index) => { cat.index = index; cat.manager = self; });
        this.debts = debts;
        this.complete = complete;
        this.currentDay = currentDay;
    }

    static fromConfig(config) {
        let categories = config["categories"];
        categories = categories.map(
            obj => new Category(
                obj[0],
                obj[1],
                obj[2].map(OptionChoice.fromArr)
            )
        );
        let debts = config["debts"].map(debt => typeof debt === "number" ? debt : debt.map(OptionChoice.fromArr));
        let complete = config["complete"];
        let currentDay = config["currentDay"];
        const manager = new CategoryManager(categories, debts, complete, currentDay);
        let currents = config["currents"];
        currents.map((arr, index) => {
            manager.categories[index].current = OptionChoice.fromArr(arr);
        });
        if (manager.currentDay !== date_string) {
            manager.rolloverDay();
        }
        manager.save();
        return manager;
    }

    toConfig() {
        const config = {};
        config["debts"] = this.debts.map(debt => typeof debt === "number" ? debt : debt.map(opt => [opt.chance, opt.value]));
        config["complete"] = this.complete;
        config["categories"] = this.categories.map(category => [
            category.category_name,
            category.unit,
            category.options.map(opt => [opt.chance, opt.value])
        ]);
        config["currentDay"] = this.currentDay;
        config["currents"] = this.categories.map(cat => [cat.current.chance, cat.current.value]);
        return config;
    }

    save() {
        console.log(this.toConfig());
        localStorage.setItem("config", JSON.stringify(this.toConfig()));
    }

    rolloverDay() {
        this.categories.forEach((category, index) => {
            if (!this.complete[index]) {
                if (category.current.value === null) return;
                if (category.numeric_category) {
                    // TODO: Multiplier
                    this.debts[index] += category.current.value;
                } else {
                    this.debts[index].push(category.current);
                }
            }
        });
        this.complete = this.categories.map(_cat => false);
        this.randomise();
        this.currentDay = date_string;
    }

    randomise() {
        var results = [];

        this.categories.forEach(category => {
            results.push(category.selectRandom());
        })
        return results;
    }

    generateElements() {
        const container = [];
        this.categories.forEach((category, index) => {
            category.debt_value = this.debts[index];
            container.push(category.generateElement(index+1, this.debts[index], this.complete[index]));
        });
        return container;
    }

    setCompleted(index, val) {
        this.complete[index] = val;
        this.save();
    }

    reduceDebt(index, amount) {
        this.debts[index] = this.debts[index] - amount;
        this.save();
    }

    completeCard(index, index2) {
        this.debts[index].splice(index2, 1);
        this.save();
    }
}


document.getElementById("the_date").innerText = date_string;

// TODO: Change me to something less personal
const default_config = {
    "categories": [
        ["Walking", "m", [
            [5, 15],
            [10, 30],
            [10, 45],
            [5, 15],
        ]],
        ["Hobbies", "m", [
            [5, 20],
            [10, 45],
            [10, 60],
            [5, 90],
        ]],
        ["Exercise", null, [
            [1, "10 Pushups"],
            [1, "20 Situps"],
            [1, "60s Russian Twist"],
        ]]
    ],
    "debts": [
        0,
        0,
        []
    ],
    "complete": [
        false,
        false,
        false,
    ],
    "currentDay": null,
    "currents": [
        [10, null],
        [10, null],
        [1, null],
    ]
}

// localStorage.clear();
var config = localStorage.getItem("config");
config = config === null ? default_config : JSON.parse(config);

var manager = CategoryManager.fromConfig(config);

console.log(manager.toConfig());

var elements = manager.generateElements();
elements.forEach(element => {
    document.getElementsByClassName("draws_container")[0].appendChild(element);
})

var timeModalMain = document.getElementById("timeModal");
var cardsModalMain = document.getElementById("cardsModal");

var configModal = document.getElementById("configModal");
var configBtn = document.getElementById("draws_config_button");
var configInput = document.getElementById("configInput");
var configSetButton = document.getElementById("configSetButton");

configBtn.onclick = function() {
    configModal.style.display = "block";
    configInput.value = JSON.stringify(manager.toConfig(), null, 2);
}
configSetButton.onclick = function () {
    const draws_container = document.getElementsByClassName("draws_container")[0];
    while (draws_container.children.length > 0) {
        draws_container.removeChild(draws_container.children[0]);
    }
    config = JSON.parse(configInput.value);
    console.log(config);
    manager = CategoryManager.fromConfig(config);
    elements = manager.generateElements();
    elements.forEach(element => {
        document.getElementsByClassName("draws_container")[0].appendChild(element);
    })

    configModal.style.display = "none";
}
window.onclick = function(event) {
    if (event.target == configModal) {
        configModal.style.display = "none";
    }
    if (event.target == timeModalMain) {
        timeModalMain.style.display = "none";
    }
    if (event.target == cardsModalMain) {
        cardsModalMain.style.display = "none";
    }
}

// TODO: Extra Modal
// TODO: Time Modal
