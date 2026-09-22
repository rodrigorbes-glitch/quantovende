CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT
  cron.schedule(
    'rate-intelligence-sync',
    '0 */6 * * *', 
    'SELECT net.http_post(
        url:=''https://djbknqsydveikuqkjogd.supabase.co/functions/v1/rate-intelligence-update'',
        headers:=jsonb_build_object(
          ''Content-Type'', ''application/json'',
          ''Authorization'', ''Bearer '' || current_setting(''app.settings.cron_secret'', true)
        ),
        body:=''{ }''::jsonb
      ) as request_id;'
  );
