import { render } from '@testing-library/react';
import ViewAction from 'container/PipelinePage/PipelineListsView/TableComponents/TableActions/ViewAction';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import i18n from 'ReactI18';
import store from 'store';

describe('PipelinePage container test', () => {
	it('should render ViewAction section', () => {
		const { asFragment } = render(
			<MemoryRouter>
				<Provider store={store}>
					<I18nextProvider i18n={i18n}>
						<ViewAction isPipelineAction />
					</I18nextProvider>
				</Provider>
			</MemoryRouter>,
		);
		expect(asFragment()).toMatchSnapshot();
	});
});
