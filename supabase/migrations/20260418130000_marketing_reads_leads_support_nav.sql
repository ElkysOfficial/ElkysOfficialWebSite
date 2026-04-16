-- F10: Marketing precisa ler leads para medir ROI de campanhas por canal.
-- A policy "Team members read leads" já existe (has_any_team_role = SELECT),
-- mas marketing não tem rota no frontend para CRM. Esta migration garante
-- que a RLS esteja correta (marketing já está incluído em has_any_team_role).
--
-- Verificação: se a policy já cobre marketing, não precisa de nada no banco.
-- O gap era apenas no frontend (rota + sidebar).

-- Nada a fazer no banco: has_any_team_role já inclui marketing.
-- Esta migration existe apenas como documentação da decisão.
SELECT 1;
