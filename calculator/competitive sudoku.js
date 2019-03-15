
var triplets = 
[[1,1,1],
[2,2,2],
[3,3,3],
[4,4,4],
[5,5,5],
[6,6,6],
[7,7,7],
[8,8,8],
[9,9,9],
[1,2,3],
[2,3,4],
[3,4,5],
[4,5,6],
[5,6,7],
[6,7,8],
[7,8,9],
[1,3,5],
[2,4,6],
[3,5,7],
[4,6,8],
[5,7,9],
[1,4,7],
[2,5,8],
[3,6,9],
[2,4,8]];

var total = 0;
var tries = 0;

var families = {};

rules = {};
(function setRules()
{
    for (var i = 0; i < triplets.length; i++)
    {
        var t = triplets[i];
        var a = t[0];
        var b = t[1];
        var c = t[2];
        addRuleLevel(a,b,c);
        addRuleLevel(a,c,b);
        addRuleLevel(b,a,c);
        addRuleLevel(b,c,a);
        addRuleLevel(c,a,b);
        addRuleLevel(c,b,a);
    }
})();

function addRuleLevel(a, b, c)
{
    if (rules[a] == undefined) rules[a] = {};
    if (rules[a][b] == undefined) rules[a][b] = {};
    rules[a][b][c] = true;
}

function getSquareStringByRows(a,b,c)
{
    return ""+a[0]+a[1]+a[2]+"|"+b[0]+b[1]+b[2]+"|"+c[0]+c[1]+c[2];
}

function getFamilyByRows(a,b,c)
{
    return getFamily(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]);
}

function getFamily(a,b,c,d,e,f,g,h,i)
{
    var family = (a+b+c+a*b*c)*
                (d+e+f+d*e*f)*
                (g+h+i+g*h*i)*
                (a+d+g+a*d*g)*
                (b+e+h+b*e*h)*
                (c+f+i+c*f*i);
    return family;
}

function addFamily(family,square)
{
    if (families[family])
    {
        families[family].total += 1;
        families[family].squares.push(square);
    }
    else families[family] = {
        total: 1,
        squares: []
    };
}


function addSquareToFamilyByRows(a,b,c)
{
    var family = getFamilyByRows(a,b,c);
    var square = getSquareStringByRows(a,b,c);
    addFamily(family, square);
}


function makeSquares(row1, row2)
{
    for (var a in rules)
    {
        for (var b in rules[a])
        {
            for (var c in rules[a][b])
            {
                var thisRow = [parseInt(a),parseInt(b),parseInt(c)];
                if (row1)
                {
                    if (row2)
                    {
                        //check cols
                        var valid = true;
                        for (var x = 0; x < 3; x++)
                        {
                            if (!(rules[row1[x]] &&
                                rules[row1[x]][row2[x]] &&
                                rules[row1[x]][row2[x]][thisRow[x]]))
                            {
                                valid = false;
                                break;
                            }
                        }
                        if (valid){
                            total++;
                            addSquareToFamilyByRows(row1, row2, thisRow);
                        }
                        tries++;
                    }
                    else makeSquares(row1, thisRow);
                }
                else makeSquares(thisRow);
            }
        }
    }

}

makeSquares();
var totalFamilies = Object.keys(families).length;