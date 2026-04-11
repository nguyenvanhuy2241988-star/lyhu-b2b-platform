-- Add description text field for detailed notes
ALTER TABLE public.factory_setup_expenses
ADD COLUMN description TEXT;
