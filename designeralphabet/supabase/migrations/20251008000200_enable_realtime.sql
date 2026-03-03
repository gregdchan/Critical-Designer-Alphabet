-- Ensure realtime publication exists for core collaborative tables.
-- Safe to run multiple times.
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
		IF NOT EXISTS (
			SELECT 1
			FROM pg_publication_tables
			WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'sessions'
		) THEN
			ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
		END IF;

		IF NOT EXISTS (
			SELECT 1
			FROM pg_publication_tables
			WHERE pubname = 'supabase_realtime'
				AND schemaname = 'public'
				AND tablename = 'participants'
		) THEN
			ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
		END IF;

		IF NOT EXISTS (
			SELECT 1
			FROM pg_publication_tables
			WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'questions'
		) THEN
			ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
		END IF;

		IF NOT EXISTS (
			SELECT 1
			FROM pg_publication_tables
			WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'responses'
		) THEN
			ALTER PUBLICATION supabase_realtime ADD TABLE public.responses;
		END IF;

		IF NOT EXISTS (
			SELECT 1
			FROM pg_publication_tables
			WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'timeline'
		) THEN
			ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline;
		END IF;

		IF NOT EXISTS (
			SELECT 1
			FROM pg_publication_tables
			WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat'
		) THEN
			ALTER PUBLICATION supabase_realtime ADD TABLE public.chat;
		END IF;

		IF NOT EXISTS (
			SELECT 1
			FROM pg_publication_tables
			WHERE pubname = 'supabase_realtime'
				AND schemaname = 'public'
				AND tablename = 'session_phases'
		) THEN
			ALTER PUBLICATION supabase_realtime ADD TABLE public.session_phases;
		END IF;
	END IF;
END
$$;
