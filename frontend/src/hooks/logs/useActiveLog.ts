import { getAggregateKeys } from 'api/queryBuilder/getAttributeKeys';
import { QueryBuilderKeys } from 'constants/queryBuilder';
import ROUTES from 'constants/routes';
import { getOperatorValue } from 'container/QueryBuilder/filters/QueryBuilderSearch/utils';
import { useQueryBuilder } from 'hooks/queryBuilder/useQueryBuilder';
import { useNotifications } from 'hooks/useNotifications';
import { getGeneratedFilterQueryString } from 'lib/getGeneratedFilterQueryString';
import { chooseAutocompleteFromCustomValue } from 'lib/newQueryBuilder/chooseAutocompleteFromCustomValue';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { AppState } from 'store/reducers';
import { SET_DETAILED_LOG_DATA } from 'types/actions/logs';
import { ILog } from 'types/api/logs/log';
import { BaseAutocompleteData } from 'types/api/queryBuilder/queryAutocompleteResponse';
import { Query } from 'types/api/queryBuilder/queryBuilderData';
import { ILogsReducer } from 'types/reducer/logs';
import { v4 as uuid } from 'uuid';

import { UseActiveLog } from './types';

export const useActiveLog = (): UseActiveLog => {
	const dispatch = useDispatch();

	const {
		searchFilter: { queryString },
	} = useSelector<AppState, ILogsReducer>((state) => state.logs);
	const queryClient = useQueryClient();
	const { pathname } = useLocation();
	const history = useHistory();
	const { currentQuery, redirectWithQueryBuilderData } = useQueryBuilder();
	const { notifications } = useNotifications();

	const { t } = useTranslation('common');

	const isLogsPage = useMemo(() => pathname === ROUTES.LOGS, [pathname]);

	const [activeLog, setActiveLog] = useState<ILog | null>(null);

	const onSetDetailedLogData = useCallback(
		(logData: ILog) => {
			dispatch({
				type: SET_DETAILED_LOG_DATA,
				payload: logData,
			});
		},
		[dispatch],
	);

	const onSetActiveLog = useCallback(
		(nextActiveLog: ILog): void => {
			if (isLogsPage) {
				onSetDetailedLogData(nextActiveLog);
			} else {
				setActiveLog(nextActiveLog);
			}
		},
		[isLogsPage, onSetDetailedLogData],
	);

	const onClearActiveLog = useCallback((): void => setActiveLog(null), []);

	const onAddToQueryExplorer = useCallback(
		async (
			fieldKey: string,
			fieldValue: string,
			operator: string,
		): Promise<void> => {
			try {
				const keysAutocompleteResponse = await queryClient.fetchQuery(
					[QueryBuilderKeys.GET_AGGREGATE_KEYS, fieldKey],
					async () =>
						getAggregateKeys({
							searchText: fieldKey,
							aggregateOperator: currentQuery.builder.queryData[0].aggregateOperator,
							dataSource: currentQuery.builder.queryData[0].dataSource,
							aggregateAttribute:
								currentQuery.builder.queryData[0].aggregateAttribute.key,
						}),
				);

				const keysAutocomplete: BaseAutocompleteData[] =
					keysAutocompleteResponse.payload?.attributeKeys || [];

				const existAutocompleteKey = chooseAutocompleteFromCustomValue(
					keysAutocomplete,
					fieldKey,
				);

				const currentOperator = getOperatorValue(operator);

				const nextQuery: Query = {
					...currentQuery,
					builder: {
						...currentQuery.builder,
						queryData: currentQuery.builder.queryData.map((item) => ({
							...item,
							filters: {
								...item.filters,
								items: [
									...item.filters.items.filter(
										(item) => item.key?.id !== existAutocompleteKey.id,
									),
									{
										id: uuid(),
										key: existAutocompleteKey,
										op: currentOperator,
										value: fieldValue,
									},
								],
							},
						})),
					},
				};

				redirectWithQueryBuilderData(nextQuery);
			} catch {
				notifications.error({ message: t('something_went_wrong') });
			}
		},
		[currentQuery, notifications, queryClient, redirectWithQueryBuilderData, t],
	);

	const onAddToQueryLogs = useCallback(
		(fieldKey: string, fieldValue: string, operator: string) => {
			const updatedQueryString = getGeneratedFilterQueryString(
				fieldKey,
				fieldValue,
				operator,
				queryString,
			);

			history.replace(`${ROUTES.LOGS}?q=${updatedQueryString}`);
		},
		[history, queryString],
	);

	return {
		activeLog,
		onSetActiveLog,
		onClearActiveLog,
		onAddToQuery: isLogsPage ? onAddToQueryLogs : onAddToQueryExplorer,
	};
};
