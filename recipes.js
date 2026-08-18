// Recipe database. Each ingredient string is matched loosely (substring, either direction)
// against the names of items the user has on hand.
const RECIPES = [
  {
    name: "Garlic Butter Pasta",
    time: "20 min",
    servings: 4,
    tags: ["pasta", "vegetarian", "quick"],
    ingredients: ["pasta", "butter", "garlic", "parmesan", "black pepper", "olive oil"],
    instructions: [
      "Boil pasta in salted water until al dente; reserve 1 cup pasta water.",
      "Melt butter with olive oil in a large pan, add minced garlic and cook 1 minute.",
      "Toss in drained pasta, splash of pasta water, and parmesan until glossy.",
      "Finish with black pepper and extra parmesan."
    ]
  },
  {
    name: "Chicken Stir Fry",
    time: "25 min",
    servings: 4,
    tags: ["freezer-friendly", "dinner"],
    ingredients: ["chicken breast", "soy sauce", "garlic", "ginger", "frozen vegetables", "rice", "vegetable oil"],
    instructions: [
      "Cook rice according to package directions.",
      "Slice chicken breast and stir-fry in oil until browned.",
      "Add garlic, ginger, and frozen vegetables; cook until tender.",
      "Stir in soy sauce and simmer 2 minutes. Serve over rice."
    ]
  },
  {
    name: "Tomato Basil Soup",
    time: "30 min",
    servings: 4,
    tags: ["soup", "vegetarian", "pantry"],
    ingredients: ["canned tomatoes", "onion", "garlic", "vegetable broth", "basil", "butter", "cream"],
    instructions: [
      "Saute diced onion and garlic in butter until soft.",
      "Add canned tomatoes and vegetable broth; simmer 15 minutes.",
      "Blend until smooth, stir in cream and basil.",
      "Season with salt and pepper to taste."
    ]
  },
  {
    name: "Black Bean Tacos",
    time: "20 min",
    servings: 4,
    tags: ["vegetarian", "quick", "mexican"],
    ingredients: ["black beans", "tortillas", "onion", "cumin", "lime", "cheese", "cilantro"],
    instructions: [
      "Saute diced onion until soft, add drained black beans and cumin.",
      "Mash lightly and heat through.",
      "Warm tortillas, fill with beans, cheese, cilantro, and a squeeze of lime."
    ]
  },
  {
    name: "Classic Fried Rice",
    time: "20 min",
    servings: 4,
    tags: ["quick", "leftovers", "freezer-friendly"],
    ingredients: ["rice", "eggs", "frozen peas", "soy sauce", "green onion", "vegetable oil", "garlic"],
    instructions: [
      "Scramble eggs in oil, set aside.",
      "Stir-fry garlic and frozen peas 2 minutes.",
      "Add cold cooked rice, breaking up clumps; stir in soy sauce.",
      "Fold eggs back in, top with green onion."
    ]
  },
  {
    name: "Creamy Chicken and Rice",
    time: "40 min",
    servings: 4,
    tags: ["dinner", "comfort food"],
    ingredients: ["chicken breast", "rice", "chicken broth", "cream of mushroom soup", "onion", "garlic"],
    instructions: [
      "Sear chicken breast, set aside.",
      "Saute onion and garlic, stir in rice, broth, and soup.",
      "Nestle chicken on top, cover and simmer 25 minutes until rice is tender."
    ]
  },
  {
    name: "Simple Omelette",
    time: "10 min",
    servings: 1,
    tags: ["breakfast", "quick", "vegetarian"],
    ingredients: ["eggs", "butter", "cheese", "milk", "salt", "black pepper"],
    instructions: [
      "Whisk eggs with a splash of milk, salt, and pepper.",
      "Melt butter in a nonstick pan over medium heat, add eggs.",
      "Sprinkle cheese, fold when set, and serve."
    ]
  },
  {
    name: "Beef and Broccoli",
    time: "25 min",
    servings: 4,
    tags: ["freezer-friendly", "dinner"],
    ingredients: ["ground beef", "broccoli", "soy sauce", "garlic", "ginger", "rice", "brown sugar"],
    instructions: [
      "Brown ground beef in a hot pan; drain excess fat.",
      "Add garlic, ginger, and broccoli (fresh or frozen); cook until crisp-tender.",
      "Stir in soy sauce and brown sugar, simmer 2 minutes.",
      "Serve over rice."
    ]
  },
  {
    name: "Lentil Soup",
    time: "45 min",
    servings: 6,
    tags: ["soup", "vegetarian", "pantry"],
    ingredients: ["lentils", "carrot", "celery", "onion", "garlic", "vegetable broth", "cumin", "canned tomatoes"],
    instructions: [
      "Saute onion, carrot, celery, and garlic until softened.",
      "Add lentils, broth, canned tomatoes, and cumin.",
      "Simmer 30 minutes until lentils are tender. Season to taste."
    ]
  },
  {
    name: "Shrimp Scampi",
    time: "20 min",
    servings: 4,
    tags: ["seafood", "quick", "freezer-friendly"],
    ingredients: ["shrimp", "pasta", "garlic", "butter", "white wine", "lemon", "parsley"],
    instructions: [
      "Cook pasta until al dente.",
      "Saute garlic in butter, add shrimp and cook until pink.",
      "Deglaze with white wine and lemon juice.",
      "Toss with pasta and parsley."
    ]
  },
  {
    name: "Veggie Frozen Vegetable Stir Fry",
    time: "15 min",
    servings: 3,
    tags: ["vegetarian", "quick", "freezer-friendly"],
    ingredients: ["frozen vegetables", "soy sauce", "garlic", "ginger", "sesame oil", "rice"],
    instructions: [
      "Heat sesame oil, add garlic and ginger.",
      "Add frozen vegetables directly to the pan, stir-fry until hot and tender.",
      "Season with soy sauce, serve over rice."
    ]
  },
  {
    name: "Baked Ziti",
    time: "45 min",
    servings: 6,
    tags: ["pasta", "comfort food", "bake"],
    ingredients: ["pasta", "marinara sauce", "ricotta", "mozzarella", "parmesan", "ground beef"],
    instructions: [
      "Cook pasta until just shy of al dente. Preheat oven to 375F.",
      "Brown ground beef, stir in marinara sauce.",
      "Combine pasta, sauce, and ricotta; top with mozzarella and parmesan.",
      "Bake 20-25 minutes until bubbly."
    ]
  },
  {
    name: "Chickpea Curry",
    time: "30 min",
    servings: 4,
    tags: ["vegetarian", "pantry", "curry"],
    ingredients: ["chickpeas", "canned tomatoes", "coconut milk", "onion", "garlic", "ginger", "curry powder", "rice"],
    instructions: [
      "Saute onion, garlic, and ginger until fragrant.",
      "Stir in curry powder, then canned tomatoes and coconut milk.",
      "Add chickpeas, simmer 15 minutes. Serve over rice."
    ]
  },
  {
    name: "Grilled Cheese and Tomato Soup",
    time: "15 min",
    servings: 2,
    tags: ["quick", "comfort food", "vegetarian"],
    ingredients: ["bread", "cheese", "butter", "canned tomatoes", "onion", "garlic"],
    instructions: [
      "Butter bread, fill with cheese, and grill in a pan until golden on both sides.",
      "For soup, simmer canned tomatoes with sauteed onion and garlic, then blend.",
      "Serve soup with sandwich for dipping."
    ]
  },
  {
    name: "Turkey Chili",
    time: "40 min",
    servings: 6,
    tags: ["freezer-friendly", "dinner"],
    ingredients: ["ground turkey", "black beans", "canned tomatoes", "onion", "garlic", "chili powder", "cumin"],
    instructions: [
      "Brown ground turkey with onion and garlic.",
      "Stir in canned tomatoes, black beans, chili powder, and cumin.",
      "Simmer 25 minutes, stirring occasionally."
    ]
  },
  {
    name: "Pancakes",
    time: "20 min",
    servings: 4,
    tags: ["breakfast", "vegetarian", "pantry"],
    ingredients: ["flour", "eggs", "milk", "sugar", "baking powder", "butter"],
    instructions: [
      "Whisk dry ingredients, then mix in eggs, milk, and melted butter.",
      "Cook 1/4 cup portions on a hot buttered griddle until bubbles form, then flip.",
      "Serve with syrup or fruit."
    ]
  },
  {
    name: "Egg Fried Noodles",
    time: "15 min",
    servings: 2,
    tags: ["quick", "vegetarian"],
    ingredients: ["noodles", "eggs", "soy sauce", "green onion", "garlic", "vegetable oil"],
    instructions: [
      "Cook noodles and drain.",
      "Scramble eggs in oil, add garlic and noodles.",
      "Toss with soy sauce and top with green onion."
    ]
  },
  {
    name: "Roast Chicken and Vegetables",
    time: "1 hr",
    servings: 4,
    tags: ["dinner", "oven"],
    ingredients: ["chicken breast", "potato", "carrot", "onion", "olive oil", "garlic", "rosemary"],
    instructions: [
      "Preheat oven to 425F. Toss chopped vegetables in olive oil, garlic, and rosemary.",
      "Arrange chicken among vegetables on a sheet pan.",
      "Roast 35-40 minutes until chicken is cooked through and vegetables are tender."
    ]
  },
  {
    name: "Minestrone Soup",
    time: "40 min",
    servings: 6,
    tags: ["soup", "vegetarian", "pantry"],
    ingredients: ["canned tomatoes", "carrot", "celery", "onion", "garlic", "pasta", "vegetable broth", "beans"],
    instructions: [
      "Saute onion, carrot, celery, and garlic.",
      "Add broth and canned tomatoes, simmer 15 minutes.",
      "Add pasta and beans, cook until pasta is tender."
    ]
  },
  {
    name: "Tuna Salad Sandwich",
    time: "10 min",
    servings: 2,
    tags: ["quick", "pantry", "no-cook"],
    ingredients: ["canned tuna", "mayonnaise", "celery", "onion", "bread", "lemon"],
    instructions: [
      "Mix drained tuna with mayonnaise, diced celery, and onion.",
      "Season with lemon juice, salt, and pepper.",
      "Serve on bread."
    ]
  },
  {
    name: "Vegetable Fried Quinoa",
    time: "25 min",
    servings: 4,
    tags: ["vegetarian", "healthy"],
    ingredients: ["quinoa", "frozen vegetables", "eggs", "soy sauce", "garlic", "sesame oil"],
    instructions: [
      "Cook quinoa according to package directions.",
      "Scramble eggs in sesame oil, add garlic and frozen vegetables.",
      "Stir in cooked quinoa and soy sauce, heat through."
    ]
  },
  {
    name: "Beef Tacos",
    time: "20 min",
    servings: 4,
    tags: ["quick", "mexican", "freezer-friendly"],
    ingredients: ["ground beef", "tortillas", "taco seasoning", "cheese", "lettuce", "tomato", "sour cream"],
    instructions: [
      "Brown ground beef and stir in taco seasoning with a splash of water.",
      "Warm tortillas.",
      "Assemble tacos with beef, cheese, lettuce, tomato, and sour cream."
    ]
  },
  {
    name: "Mushroom Risotto",
    time: "35 min",
    servings: 4,
    tags: ["vegetarian", "comfort food"],
    ingredients: ["rice", "mushroom", "vegetable broth", "onion", "garlic", "parmesan", "butter", "white wine"],
    instructions: [
      "Saute onion, garlic, and mushrooms in butter until golden.",
      "Add rice, toast 1 minute, then deglaze with wine.",
      "Add warm broth a ladle at a time, stirring until absorbed, about 20 minutes.",
      "Finish with parmesan and butter."
    ]
  },
  {
    name: "Greek Salad",
    time: "10 min",
    servings: 4,
    tags: ["salad", "no-cook", "vegetarian", "quick"],
    ingredients: ["cucumber", "tomato", "red onion", "feta cheese", "olives", "olive oil", "lemon"],
    instructions: [
      "Chop cucumber, tomato, and red onion.",
      "Toss with olives and feta.",
      "Dress with olive oil and lemon juice."
    ]
  },
  {
    name: "Split Pea Soup",
    time: "1 hr",
    servings: 6,
    tags: ["soup", "pantry", "freezer-friendly"],
    ingredients: ["split peas", "carrot", "celery", "onion", "garlic", "vegetable broth", "ham"],
    instructions: [
      "Saute onion, carrot, celery, and garlic.",
      "Add split peas, broth, and diced ham.",
      "Simmer 45 minutes until peas break down."
    ]
  },
  {
    name: "Frittata",
    time: "25 min",
    servings: 4,
    tags: ["breakfast", "vegetarian", "leftovers"],
    ingredients: ["eggs", "milk", "cheese", "frozen vegetables", "onion", "butter"],
    instructions: [
      "Preheat oven to 375F. Whisk eggs with milk, salt, and pepper.",
      "Saute onion and frozen vegetables in an oven-safe pan with butter.",
      "Pour in eggs, top with cheese, and bake 15-18 minutes until set."
    ]
  },
  {
    name: "Pesto Pasta",
    time: "15 min",
    servings: 4,
    tags: ["pasta", "vegetarian", "quick"],
    ingredients: ["pasta", "pesto", "parmesan", "cherry tomatoes", "pine nuts"],
    instructions: [
      "Cook pasta until al dente, reserve some pasta water.",
      "Toss hot pasta with pesto, loosening with pasta water as needed.",
      "Top with halved cherry tomatoes, pine nuts, and parmesan."
    ]
  },
  {
    name: "Shepherd's Pie",
    time: "50 min",
    servings: 6,
    tags: ["comfort food", "freezer-friendly", "bake"],
    ingredients: ["ground beef", "potato", "carrot", "peas", "onion", "beef broth", "butter", "milk"],
    instructions: [
      "Boil and mash potatoes with butter and milk.",
      "Brown ground beef with onion and carrot, add peas and broth, simmer until thickened.",
      "Top meat mixture with mashed potato and bake at 400F for 20 minutes until golden."
    ]
  },
  {
    name: "Caprese Salad",
    time: "10 min",
    servings: 4,
    tags: ["salad", "no-cook", "vegetarian", "quick"],
    ingredients: ["tomato", "mozzarella", "basil", "olive oil", "balsamic vinegar"],
    instructions: [
      "Slice tomato and mozzarella, arrange with basil leaves.",
      "Drizzle with olive oil and balsamic vinegar."
    ]
  },
  {
    name: "Chicken Noodle Soup",
    time: "45 min",
    servings: 6,
    tags: ["soup", "comfort food"],
    ingredients: ["chicken breast", "noodles", "carrot", "celery", "onion", "chicken broth", "garlic"],
    instructions: [
      "Saute onion, carrot, celery, and garlic in a pot.",
      "Add broth and chicken, simmer until chicken is cooked, then shred.",
      "Add noodles and cook until tender."
    ]
  },
  {
    name: "Banana Bread",
    time: "1 hr",
    servings: 8,
    tags: ["baking", "vegetarian", "pantry"],
    ingredients: ["banana", "flour", "sugar", "eggs", "butter", "baking soda"],
    instructions: [
      "Preheat oven to 350F. Mash bananas and mix with melted butter and sugar.",
      "Beat in eggs, then fold in flour and baking soda.",
      "Pour into a greased loaf pan and bake 55-60 minutes."
    ]
  },
  {
    name: "Sausage and Peppers",
    time: "30 min",
    servings: 4,
    tags: ["dinner", "freezer-friendly"],
    ingredients: ["sausage", "bell pepper", "onion", "olive oil", "garlic", "bread"],
    instructions: [
      "Slice sausage, bell peppers, and onion.",
      "Saute sausage until browned, add peppers, onion, and garlic.",
      "Cook until vegetables are tender. Serve on bread or over rice."
    ]
  },
  {
    name: "Vegetable Curry",
    time: "35 min",
    servings: 4,
    tags: ["vegetarian", "curry", "freezer-friendly"],
    ingredients: ["frozen vegetables", "coconut milk", "curry powder", "onion", "garlic", "ginger", "rice"],
    instructions: [
      "Saute onion, garlic, and ginger, add curry powder and cook 1 minute.",
      "Stir in coconut milk and frozen vegetables, simmer 15 minutes.",
      "Serve over rice."
    ]
  },
  {
    name: "Pizza Toast",
    time: "10 min",
    servings: 2,
    tags: ["quick", "vegetarian", "kid-friendly"],
    ingredients: ["bread", "marinara sauce", "mozzarella", "oregano"],
    instructions: [
      "Spread marinara on toasted bread, top with mozzarella and oregano.",
      "Broil until cheese melts and bubbles."
    ]
  },
  {
    name: "Salmon with Roasted Vegetables",
    time: "30 min",
    servings: 4,
    tags: ["seafood", "healthy", "oven"],
    ingredients: ["salmon", "broccoli", "olive oil", "lemon", "garlic"],
    instructions: [
      "Preheat oven to 400F. Toss broccoli with olive oil and garlic on a sheet pan.",
      "Nestle salmon among vegetables, drizzle with olive oil and lemon.",
      "Roast 15-18 minutes until salmon flakes easily."
    ]
  },
  {
    name: "Peanut Butter Noodles",
    time: "15 min",
    servings: 4,
    tags: ["quick", "vegetarian", "pantry"],
    ingredients: ["noodles", "peanut butter", "soy sauce", "garlic", "ginger", "lime", "green onion"],
    instructions: [
      "Cook noodles and drain.",
      "Whisk peanut butter, soy sauce, garlic, ginger, and lime juice with a splash of hot water.",
      "Toss noodles with sauce, top with green onion."
    ]
  },
  {
    name: "French Toast",
    time: "15 min",
    servings: 4,
    tags: ["breakfast", "vegetarian", "quick"],
    ingredients: ["bread", "eggs", "milk", "cinnamon", "butter", "sugar"],
    instructions: [
      "Whisk eggs, milk, cinnamon, and sugar.",
      "Dip bread slices and cook in buttered pan until golden on both sides."
    ]
  },
  {
    name: "White Bean and Kale Soup",
    time: "35 min",
    servings: 4,
    tags: ["soup", "vegetarian", "healthy", "pantry"],
    ingredients: ["white beans", "kale", "onion", "garlic", "vegetable broth", "canned tomatoes"],
    instructions: [
      "Saute onion and garlic, add broth and canned tomatoes.",
      "Add white beans, simmer 10 minutes.",
      "Stir in chopped kale and cook until wilted."
    ]
  },
  {
    name: "Quesadillas",
    time: "10 min",
    servings: 2,
    tags: ["quick", "vegetarian", "kid-friendly"],
    ingredients: ["tortillas", "cheese", "onion", "bell pepper"],
    instructions: [
      "Fill a tortilla with cheese and sauteed onion and pepper, top with another tortilla.",
      "Cook in a dry pan until golden and cheese melts, flipping once."
    ]
  }
];

// Ingredients so commonly on hand that we don't count them as "missing"
// unless the user explicitly lists them (in which case they still just match normally).
const PANTRY_STAPLES = [
  "salt", "black pepper", "water", "sugar", "olive oil", "vegetable oil"
];

if (typeof module !== "undefined") {
  module.exports = { RECIPES, PANTRY_STAPLES };
}
