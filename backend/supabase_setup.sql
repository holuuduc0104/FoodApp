-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ingredients table
CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    ingredients TEXT[],
    instructions TEXT,
    cooking_time INTEGER,
    difficulty TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Create policies for ingredients
CREATE POLICY "Users can view their own ingredients"
    ON public.ingredients FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ingredients"
    ON public.ingredients FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ingredients"
    ON public.ingredients FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for recipes (public read)
CREATE POLICY "Anyone can view recipes"
    ON public.recipes FOR SELECT
    USING (true);

-- Insert sample recipes
INSERT INTO public.recipes (name, description, ingredients, instructions, cooking_time, difficulty, image_url) VALUES
('Fried Rice', 'Classic Asian fried rice with vegetables', ARRAY['Rice', 'Egg', 'Carrot', 'Onion', 'Garlic', 'Soy Sauce'], 
 '1. Cook rice and let cool\n2. Heat oil in wok\n3. Scramble eggs\n4. Add vegetables\n5. Add rice and soy sauce\n6. Stir fry until done', 
 20, 'Easy', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b'),

('Chicken Stir Fry', 'Quick and healthy chicken stir fry', ARRAY['Chicken', 'Bell Pepper', 'Broccoli', 'Garlic', 'Soy Sauce', 'Ginger'],
 '1. Cut chicken into pieces\n2. Heat oil in pan\n3. Cook chicken until done\n4. Add vegetables\n5. Add sauce\n6. Stir fry 5 minutes',
 25, 'Easy', 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143'),

('Tomato Pasta', 'Simple tomato pasta with basil', ARRAY['Pasta', 'Tomato', 'Garlic', 'Olive Oil', 'Basil'],
 '1. Boil pasta\n2. Sauté garlic in olive oil\n3. Add chopped tomatoes\n4. Simmer 10 minutes\n5. Mix with pasta\n6. Add fresh basil',
 30, 'Easy', 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9'),

('Vegetable Soup', 'Hearty vegetable soup', ARRAY['Carrot', 'Potato', 'Onion', 'Celery', 'Garlic', 'Vegetable Broth'],
 '1. Chop all vegetables\n2. Sauté onion and garlic\n3. Add vegetables\n4. Pour broth\n5. Simmer 30 minutes\n6. Season to taste',
 45, 'Medium', 'https://images.unsplash.com/photo-1547592166-23ac45744acd'),

('Beef Tacos', 'Mexican beef tacos', ARRAY['Beef', 'Tortilla', 'Lettuce', 'Tomato', 'Cheese', 'Onion'],
 '1. Cook ground beef\n2. Season with spices\n3. Warm tortillas\n4. Fill with beef\n5. Add toppings\n6. Serve hot',
 20, 'Easy', 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b');
