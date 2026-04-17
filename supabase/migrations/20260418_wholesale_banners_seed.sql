-- Thêm 3 banner mẫu cho hệ thống B2B
INSERT INTO public.wholesale_banners (image_url, link_url, position, sort_order)
VALUES
  ('https://picsum.photos/seed/b2bmain1/800/400', '#flash-sale', 'main_slider', 1),
  ('https://picsum.photos/seed/b2bmain2/800/400', '#promotions', 'main_slider', 2),
  ('https://picsum.photos/seed/b2bmain3/800/400', '#new-arrivals', 'main_slider', 3),
  ('https://picsum.photos/seed/b2btop/400/195', '#topsale', 'side_top', 1),
  ('https://picsum.photos/seed/b2bbottom/400/195', '#combos', 'side_bottom', 1)
ON CONFLICT DO NOTHING;
