"use strict";

function dice_initialize(container) {
    var passiveSupported = false;
    var name;

    try {
    var options = Object.defineProperty({}, "passive", {
        get: function() {
        passiveSupported = true;
        }
    });

    window.addEventListener("test", null, options);
    } catch(err) {}

    $t.remove($t.id('loading_text'));

    var canvas = $t.id('canvas');
    canvas.style.width = window.innerWidth - 1 + 'px';
    canvas.style.height = window.innerHeight - 1 + 'px';
    var label = $t.id('label');
    var set = $t.id('set');
    var selector_div = $t.id('selector_div');
    var info_div = $t.id('info_div');
    on_set_change();

    $t.dice.use_true_random = false;

    function on_set_change(ev) { set.style.width = set.value.length + 3 + 'ex'; }
    $t.bind(set, 'keyup', on_set_change);
    $t.bind(set, ['mousedown','touchstart'], function(ev) { ev.stopPropagation(); });
    $t.bind(set, ['mouseup', 'touchend'], function(ev) { 
        ev.stopPropagation();
        set.setSelectionRange(0,9999);
        on_set_change();});
    $t.bind(set, 'focus', function(ev) { $t.set(container, { class: '' }); });
    $t.bind(set, 'blur', function(ev) { $t.set(container, { class: 'noselect' }); });

    $t.bind($t.id('clear'), ['mouseup', 'touchend'], function(ev) {
        ev.stopPropagation();
        set.value = '';
        on_set_change();
    });

    var box = new $t.dice.dice_box(canvas, { w: window.innerWidth, h: window.innerHeight });
    box.animate_selector = true;

    $t.bind(window, 'resize', function() {
        canvas.style.width = window.innerWidth - 1 + 'px';
        canvas.style.height = window.innerHeight - 1 + 'px';
        box.reinit(canvas, { w: window.innerWidth, h: window.innerHeight });
    });

    function show_selector() {
        info_div.style.display = 'none';
        selector_div.style.display = 'inline-block';
        box.draw_selector();
    }

    function before_roll(vectors, notation, callback) {
        info_div.style.display = 'none';
        selector_div.style.display = 'none';
        post('Rolling ' + $t.dice.stringify_notation(notation) + '!', name);
        // do here rpc call or whatever to get your own result of throw.
        // then callback with array of your result, example:
        // callback([2, 2, 2, 2]); // for 4d6 where all dice values are 2.
        callback();
    }

    function notation_getter() {
        return $t.dice.parse_notation(set.value);
    }

    function after_roll(notation, result) {
        var res = result.join(', ');
        if (notation.constant) res += ' + ' + notation.constant;
        if (result.length > 1 || notation.constant) res += ' = ' + 
                (result.reduce(function(s, a) { return s + a; }) + notation.constant);
        post(res, name);
        label.innerHTML = res;
        info_div.style.display = 'inline-block';
    }

    function post(msg, name = "Unknown Roller"){
        var formData = new FormData();
        var webhook;
        
        formData.append("content", msg);
        formData.append("username", name);

        var request = new XMLHttpRequest();
        if (name=="Keeper"){
            webhook = "https://discordapp.com/api/webhooks/339844402010914817/mdMxak21V-yd_eCZBJuLXL7yh27XBOxTtLlQ3KXyxnWP5qEXffN4OOpmxx2B-8EmwuiM";
        } else if (name=="Memechat"){
            webhook = "https://discordapp.com/api/webhooks/340565955899817984/phSmTG4D9yx2TjBGP4IYdhd-btIdP6BHUfW20Hc_2VQOAS4gK-K7DXg2sufcg1rSsmHt";
        } else {
            webhook = "https://discordapp.com/api/webhooks/339844402010914817/mdMxak21V-yd_eCZBJuLXL7yh27XBOxTtLlQ3KXyxnWP5qEXffN4OOpmxx2B-8EmwuiM";
        }
        request.open("POST", webhook);
        request.send(formData);
    }

    box.bind_mouse(container, passiveSupported, notation_getter, before_roll, after_roll);
    box.bind_throw($t.id('throw'), notation_getter, before_roll, after_roll);

    $t.bind(container, ['mouseup','touchend'], function(ev) {
        ev.stopPropagation();
        if (selector_div.style.display == 'none') {
            if (!box.rolling) show_selector();
            //box.rolling = false;
            return;
        }
        if(document.activeElement == set){
            set.blur();
        }
        var name = box.search_dice_by_mouse(ev);
        if (name != undefined) {
            var notation = $t.dice.parse_notation(set.value);
            notation.set.push(name);
            set.value = $t.dice.stringify_notation(notation);
            on_set_change();
        }
    });

    var params = $t.get_url_params();
    if (params.notation) {
        set.value = params.notation;
    }
        if (params.name) {
        name = params.name;
        show_selector();
    }
    if (params.roll) {
        $t.raise_event($t.id('throw'), 'mouseup');
    }
    else {
        show_selector();
    }
}
