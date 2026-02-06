-- Unify existing user emails to standard format
UPDATE users SET email = CONCAT(username, '@tba.ly');
