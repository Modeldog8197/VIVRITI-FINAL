function menu(){
    document.getElementById('menu-btn').style.visibility = 'hidden';
    document.getElementById('side-bar').style.left = '0';
}      
function clsemenu(){
    document.getElementById('side-bar').style.left = '-300px';
    document.getElementById('menu-btn').style.visibility = 'visible';
}
function opn() {
    document.getElementById('chatbot').style.marginLeft = '1100px';
    document.getElementById('button').style.visibility = 'hidden';
    document.getElementById('closebutton').style.visibility = 'visible';
}
 function clse() {
        document.getElementById('chatbot').style.marginLeft = '957483px';
        document.getElementById('button').style.visibility = 'visible';
        document.getElementById('closebutton').style.visibility = 'hidden';
}