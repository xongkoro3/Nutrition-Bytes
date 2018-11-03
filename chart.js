function Chart() {
    var percentFormat = d3.format(".2%");
    var margin = { top: 60, right: 0, bottom: 0, left: 0 };
    var isFull = true;
    var paddingEdge = 140;
    var width = 700 - margin.left - margin.right;
    var height = 600 - margin.top - margin.bottom;
    var innerRadius = 20;
    var outerRadius = 50;
    var allergies = [];
    
    var arcInnerR = 29;
    var arcOuterR = 30;
    var arcBackgroundInnerR = 30;
    var arcBackgroundOuterR = 240;


    var showNames = false;
    var showValues = false;
    var showLabels = false;
    var showAxes = false;

    var sortByAmount = false;
    var sortBySentiment = false;
    var chartData;
    var numElements = 0;
    var nut_lengths;
    var ing_lengths;
    var ing_lengths;

    var include = {
        'Proximate': true,
        'Mineral': true,
        'Vitamin': true,
        'Lipid': true
    };

    var updateAllergies;
    var updateLabels;
    var updateNutrients;
    var sortNutrients;
    var sortIngredients;
    var drawIngredientBars;
    var drawNutrientBars;
    var updateData;

    var compareNutrients = function(a, b) {
        if(sortByAmount) {
            return d3.descending(+a["%DV"], +b["%DV"]);
        } else {
            var order = d3.ascending(a["class"], b["class"]);
            return order === 0 ? d3.descending(+a["%DV"], +b["%DV"]) : order;
        }
    };

    var compareIngredients = function(a, b) {
        if(sortBySentiment) {
            return d3.descending(+a.sentiment, +b.sentiment);
        } else {
            return d3.ascending(+a.rank, +b.rank);
        }
    };

    var filterNutrients = function(a) {
        return include[a["class"]];
    };

    function my(selection) {
        selection.each(function(data, i){
            // make svg element using margin convention
            var svg = selection.selectAll("svg")
                .data(data)
                .enter()
                .append("div")
                .attr("class", "food")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate("+(margin.left)+","+margin.top+")");

            var nutrients = data.map(function(x) {
                return x.nutrients.sort(compareNutrients); 
            });
            
            var ingredients = data.map(function(x) {
                return x.ingredients.map(function(d, i) {
                    d.rank = i;
                    return d;
                });
            });
            
            for(var i = 0; i < data.length; i++) {
                data[i].nutrients = nutrients[i];
                data[i].ingredients = ingredients[i];
            }
            
            if(!numElements) {
                nut_lengths = nutrients.map(function(x) { return x.length; });
                ing_lengths = ingredients.map(function(x) { return x.length; });
                numElements = Math.max(Math.max(...nut_lengths), Math.max(...ing_lengths));
            }
            
            // scales
            var yScale = d3.scaleBand()
                .domain(d3.range(numElements))
                .rangeRound([0, height]);

            var xScaleIngredients = d3.scaleLinear()
                .domain([0, 1])
                .range([0, width/2 - paddingEdge]);

            var xScaleNutrients = d3.scaleLinear()
                .domain([1.0, 0])
                .range([0, width/2 - paddingEdge]);


            //set up axes
            if(showAxes){
                var Axis = d3.axisTop()
                            .scale(xScaleNutrients)
                            .ticks(5, ".0%");
                svg.append("g")
                    .attr("class", "axis-label")
                    .attr("transform","translate(110," + height/3 + ")")
                    .call(Axis);
            }



            //arc
            var arc = d3.arc()
                        .innerRadius(arcInnerR)
                        .outerRadius(arcOuterR)
                        .startAngle(0)
                        .endAngle(2 * Math.PI);
    
            svg.append("path")
                .attr("class", "arc")
                .attr("d", arc)
                .attr("transform", "translate("+width/2+","+height/3+")");      
            
            var arcBackgroundTop = d3.arc()
                        .innerRadius(arcBackgroundInnerR)
                        .outerRadius(arcBackgroundOuterR)
                        .startAngle(-90 * (Math.PI/180))
                        .endAngle(90 * (Math.PI/180));
                        
            svg.append("path")
                .attr("class", "arc")
                .attr("d", arcBackgroundTop)
                .attr("transform", "translate("+width/2+","+height/3+")")
                .style("fill-opacity", .1)
                .style("stroke-opacity", 0) 
                .style("stroke", "red")   
                .style("fill", "red");
            
            var arcBackgroundBottom = d3.arc()
                        .innerRadius(arcBackgroundInnerR)
                        .outerRadius(arcBackgroundOuterR)
                        .startAngle(90 * (Math.PI/180))
                        .endAngle(270 * (Math.PI/180));
                        
            svg.append("path")
                .attr("class", "arc")
                .attr("d", arcBackgroundBottom)
                .attr("transform", "translate("+width/2+","+height/3+")")
                .style("fill-opacity", .1)
                .style("stroke-opacity", 0) 
                .style("stroke", "red")   
                .style("fill", "green");
            
            // legend
            var rect = svg.append("rect")
                            .attr("width", 20)
                            .attr("height", 10)
                            .style("fill", "red")             
                            .style("fill-opacity", .1)
                            .attr("transform", "translate("+(width/2-50)+","+((height/3)+300) +")");

            var rect = svg.append("rect")
                            .attr("width", 20)
                            .attr("height", 10)
                            .style("fill", "green")             
                            .style("fill-opacity", .1)
                            .attr("transform", "translate("+(width/2-50)+","+((height/3)+320)+")");
            
            var text = svg.append("text")
                        .attr("transform", "translate("+((width/2)-20)+","+((height/3)+310)+")")
                        .attr("font-size", "12px")
                        .text("Nutrient (%DV)");

            var text = svg.append("text")
                        .attr("transform", "translate("+((width/2)-20)+","+((height/3)+330)+")")
                        .attr("font-size", "12px")
                        .text("Ingredient (%Positive Sentiment)");

            // tooltip
            if(isFull) {
                var tooltip = selection.append("div").attr("class", "tooltip hidden")
            }

            // title
            var transY = isFull ? -10 : 5;
            var fontSize = isFull ? '1.5em' : '0.5em';
            var chartTitle = svg.append("text")
                .attr("class", "title")
                .attr("text-anchor", "middle")
                .attr("font-size", fontSize)
                .attr("font-weight", "bold")
                .attr("transform", "translate("+width/2+","+transY+")")
                .text(function(d) { return d.name;});
            

            drawNutrientBars = function(dur) {
                // add nutrient bars and bind data to bars
                var nutrientBars = svg.selectAll(".nutrient-bar")
                    .data(function(d) { 
                        var list = d.nutrients.filter(filterNutrients).sort(compareNutrients); 
                        list.forEach(function(d){d["__length"]=list.length});
                        return list;
                    }, function(d) { return d.nutrient; });
                // handle new and existing data
                nutrientBars.enter()
                    .append("rect")
                    .attr("class", function(d) {
                        return "nutrient-bar " + d["class"]; 
                    })
                    .on("mouseover", function(d) {
                        if(!isFull) return;
                        tooltip.attr("class", "tooltip")
                            .text(d.nutrient+"\n"+percentFormat(d["%DV"]) + 
                                " DV\n" + d.amount + " " + d.unit)
                            .style("right", (width/2 + margin.left)+"px")
                            .style("left", "")
                            .style("top", (+d3.select(this).attr("y")+"px"));
                    })
                    .on("mouseout", function(d) {
                        if(!isFull) return;
                        tooltip.attr("class", "tooltip hidden");
                    })
                    .merge(nutrientBars)
                    .sort(compareNutrients)
                    .transition()
                    .duration(dur)
                    .attr("x", function(d) {
                        // return  xScaleNutrients(d["%DV"]);
                        return width/2;
                    })
                    .attr("y", function(d, i) {
                        // return yScale(i);
                        return height/3;
                    })
                    .attr("transform",  function(d, i) {
                        console.log(nut_lengths);
                        return "translate(" + arcOuterR*-Math.cos(i/d.__length*Math.PI) + "," + arcOuterR*-Math.sin(i/d.__length*Math.PI) + ")" + "rotate(" + ((i/d.__length)*180 +180) + "," + width/2 +"," + height/3 +")";
                    })
                    .attr("width", function(d) {
                        return width/2 - paddingEdge - xScaleNutrients(d["%DV"]);
                    })
                    .attr("height", yScale.bandwidth()*1/3);
                // get rid of old/unneeded bars
                nutrientBars.exit().remove();
            };
            drawNutrientBars(0);

            drawIngredientBars = function(dur) {
                // add ingredient bars and bind data to bars
                var ingredientBars = svg.selectAll(".ingredient-bar")
                    .data(function(d) { 
                        var list = d.ingredients.sort(compareIngredients);
                        list.forEach(function(d){d["__length"]=list.length});
                        return list; 
                    }, function(d) { return d.ingredient; });
                // handle new and existing data
                ingredientBars.enter()
                    .append("rect")
                    .on("mouseover", function(d) {
                        if(!isFull) return;
                        tooltip.attr("class", "tooltip")
                            .text(d.ingredient+"\n"+
                                percentFormat(d["sentiment"])+
                                " positive\nAmount Order: "+(d["rank"]+1))
                            .style("left", (width/2 + margin.left)+"px")
                            .style("right", "")
                            .style("top", (+d3.select(this).attr("y"))+"px");
                    })
                    .on("mouseout", function(d) {
                        if(!isFull) return;
                        tooltip.attr("class", "tooltip hidden");
                    })
                    .attr("class", "ingredient-bar")
                    .merge(ingredientBars)
                    .transition()
                    .duration(dur)
                    .attr("x", function(d, i) { return width/2; })
                    .attr("y", function(d, i) { return height/3; })
                    .attr("transform",  function(d, i) {
                        return "translate(" + arcOuterR*Math.cos(i/d.__length*Math.PI) + "," + arcOuterR*Math.sin(i/d.__length*Math.PI) + ")" + "rotate(" +  (i/d.__length)*180 + ","+ width/2 +"," + height/3 +")";
                    })
                    .attr("width", function(d) { return xScaleIngredients(d.sentiment); })
                    .attr("height", yScale.bandwidth()*2/3)
                // get rid of old/unneeded bars
                ingredientBars.exit().remove();
            }
            drawIngredientBars(0);

            updateData = function(value) {
                svg.data(value);
                drawNutrientBars(500);
                drawIngredientBars(500);
                updateLabels();
                updateAllergies();
                svg.select('.title').text(function(d) {
                    return d.name;
                });
            };

            sortNutrients = function() {
                drawNutrientBars(500);

                svg.selectAll(".nutrient-bar-label")
                    .sort(compareNutrients)
                    .transition()
                    .duration(500)
                    .attr("y", function(d, i) {
                        return yScale(i) + yScale.bandwidth() / 2;
                    })
                    .attr("x", function(d) {
                        return paddingEdge + xScaleNutrients(d["%DV"]) - 5;
                    });
            };

            sortIngredients = function() {
                drawIngredientBars(500);

                svg.selectAll(".ingredient-bar-label")
                    .sort(compareIngredients)
                    .transition()
                    .duration(500)
                    .attr("y", function(d, i) { return yScale(i) + yScale.bandwidth() / 2; })
                    .attr("x", function(d) {
                        return width/2 + xScaleIngredients(d.sentiment) + 5;
                    });
            };

            updateNutrients = function() {
                drawNutrientBars(500);
                updateLabels();
            };

            updateAllergies = function() {
                svg.selectAll(".ingredient-bar")
                    .each(function(d, i) {
                        var c = "ingredient-bar";
                        var ing = d.ingredient.toLowerCase();
                        for(var i = 0; i < allergies.length; i++) {
                            if(ing.indexOf(allergies[i]) !== -1) {
                                c += " allergy";
                                break;
                            }
                        }
                        d3.select(this).attr("class", c);
                    });
            };

            updateLabels = function() {
                if(showNames || showValues) {
                    var labels = svg.selectAll(".ingredient-bar-label")
                        .data(function(d) {
                            return d.ingredients; 
                        }, function(d) {
                            return d.ingredient; 
                        });

                    labels.enter()
                        .append("text")
                        .merge(labels)
                        .sort(compareIngredients)
                        .attr("text-anchor", "start")
                        .attr("class", "ingredient-bar-label")
                        .attr("x", function(d) {
                            return width/2;
                        })
                        .attr("y", function(d, i) {
                            return height/3;
                        })
                        .attr("transform",  function(d, i) {
                            return "translate(" + (arcOuterR+xScaleIngredients(d.sentiment))*Math.cos(i/d.__length*Math.PI) + "," + (arcOuterR+xScaleIngredients(d.sentiment))*Math.sin(i/d.__length*Math.PI) + ")"+ "rotate(" +  (i/d.__length)*180 + ","+ width/2 +"," + height/3 +")";
                        })
                        .text(function(d) {
                            var label = "";
                            if(showNames && showValues) {
                                label = d.ingredient+", "+percentFormat(d.sentiment);
                            } else if(showNames) {
                                label = d.ingredient;
                            } else {
                                label = percentFormat(d.sentiment);
                            }
                            return label;
                        });
                    labels.exit().remove();

                    labels = svg.selectAll(".nutrient-bar-label")
                        .data(function(d) { 
                            return d.nutrients.filter(filterNutrients).sort(compareNutrients);
                        }, function(d) {
                            return d.nutrient;
                        });

                    labels.enter()
                        .append("text")
                        .merge(labels)
                        .attr("text-anchor", "end")
                        .attr("class", "nutrient-bar-label")
                        .attr("x", function(d) {
                            return width/2;;
                        })
                        .attr("y", function(d, i) {
                            return height/3;
                        })
                        .attr("transform",  function(d, i) {
                            return "translate(" + (arcOuterR+(width/2 - paddingEdge - xScaleNutrients(d["%DV"])+20))*-Math.cos(i/d.__length*Math.PI) + "," + (arcOuterR + (width/2 - paddingEdge - xScaleNutrients(d["%DV"])+20))*-Math.sin(i/d.__length*Math.PI) + ")"+ "rotate(" +  (i/d.__length)*180 + ","+ width/2 +"," + height/3 +")";
                        })
                        .text(function(d) {
                            var label = "";
                            if(showNames && showValues)
                                label = d.nutrient+", "+percentFormat(d["%DV"]);
                            else if(showNames) label = d.nutrient;
                            else label = percentFormat(d["%DV"]);
                            return label;
                        });
                    labels.exit().remove();

                } else {
                    svg.selectAll(".ingredient-bar-label").remove();
                    svg.selectAll(".nutrient-bar-label").remove();
                }
            };
        });

    }

    // getter and setter for width
    my.width = function(value) {
        if(!arguments.length) {
            return width;
        }
        width = value - margin.right - margin.left;
        return my;
    };

    // getter and setter for height
    my.height = function(value) {
        if(!arguments.length) {
            return height;
        }
        height = value - margin.top - margin.bottom;
        return my;
    };

    // getter and setter for margins
    my.margin = function(value) {
        if(!arguments.length) {
            return margin;
        }
        margin = value;
        return my;
    };

    // getter and setter for padding
    my.paddingEdge = function(value) {
        if(!arguments.length) {
            return paddingEdge;
        }
        paddingEdge = value;
        return my;
    };

    // getter and setter for arcInnerR
    my.arcInnerR = function(value) {
        if(!arguments.length) {
            return arcInnerR;
        }
        arcInnerR = value;
        return my;
    };

    // getter and setter for arcOuterR
    my.arcOuterR = function(value) {
        if(!arguments.length) {
            return arcOuterR;
        }
        arcOuterR = value;
        return my;
    };
    
    // getter and setter for arcBackgroundInnerR
    my.arcBackgroundInnerR = function(value) {
        if(!arguments.length) {
            return arcBackgroundInnerR;
        }
        arcBackgroundInnerR = value;
        return my;
    };
    
    // getter and setter for arcBackgroundOuterR
    my.arcBackgroundOuterR = function(value) {
        if(!arguments.length) {
            return arcBackgroundOuterR;
        }
        arcBackgroundOuterR = value;
        return my;
    };
    
    my.full = function(value) {
        if(!arguments.length) {
            return isFull;
        }
        isFull = value;
        return my;
    };

    my.showAxes = function(value) {
        if(!arguments.length) {
            return showAxes;
        }
        showAxes = value;
        return my;
    };

    my.addAllergy = function(value) {
        allergies.push(value.toLowerCase());
        updateAllergies();
        return my;
    };

    my.removeAllergy = function(value) {
        var index = allergies.indexOf(value.toLowerCase());
        if(index != -1) {
            allergies.splice(index, 1);
            updateAllergies();
        }
        return my;
    };

    my.labels = function(names, values) {
        showNames = names;
        showValues = values;
        updateLabels();
        return my;
    };

    my.sortNutrientBars = function(amount) {
        sortByAmount = amount;
        sortNutrients();
        return my;
    };

    my.sortIngredientBars = function(sentiment) {
        sortBySentiment = sentiment;
        sortIngredients();
        return my;
    };

    my.filterNutrientBars = function(change) {
        include[change['class']] = change.value;
        updateNutrients();
        return my;
    };

    my.updateData = function(value) {
        updateData(value);
        return my;
    };

    my.numElements = function(value) {
        if(!arguments.length) {
            return numElements;
        }
        numElements = value;
        return my;
    };

    return my;
}
