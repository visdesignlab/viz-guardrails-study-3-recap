/* eslint-disable import/no-cycle */
import {
  HoverCard, Button, Text, Group, TypographyStylesProvider,
} from '@mantine/core';
import { ChartParams } from './DataExplorer';

export function Help({
  parameters,
} : {
    parameters: ChartParams
}) {
  const helpText = (parameters.dataset === 'clean_data'
    ? (
      <TypographyStylesProvider>
        Select any subset of countries to the left of the visualization.
        <h4>Background:</h4>
        You live in a fantasy world that consists of your home country, as well as other
        15 countries located across 5 continents: Eldoril, Thundoril, Aerion, Silvoria, and Mystara.
        Countries within each continent are similar to each other in size and demographics.
        <h4>Scenario:</h4>
        You are an analyst for the Viral Disease Policy Center of your home country at time when there is a new
        viral disease called
        <i> Celestial Sniffles</i>
        . Luckily, your country has not been affected yet
        and has time to prepare and decide on a policy to combat it. You have access to the infection
        data from other countries that implemented one of the 3 available policies: A, B, or C.
        However, due to socioeconomic factors, the Surgeon General in your country has
        <i> already decided on a policy</i>
        .
        <h4>Task:</h4>
        You are tasked with leading the promotion efforts and advertising the chosen policy to the population using data.
        In the experiment, you will use an interactive data explorer that shows infection data from other countries.
        You should select a view that best shows (and convinces the population) that your country&apos;s
        {' '}
        <b>
          chosen
          policy is the best policy to combat the disease
        </b>
        . After finalizing the view, click the
        camera button and add a caption or a slogan that will go along with your visualization.
      </TypographyStylesProvider>
    )
    : (
      <TypographyStylesProvider>
        Select any subset of stocks to the left of the visualization.
        <h4>Scenario:</h4>
        {' '}
        You are a financial advisor. Your client approached you asking for help in
        picking a new investment---an industry fund that equally invests within a single industry.
        The client prefers to make their decisions
        {' '}
        <i>solely based on the data</i>
        , and not based on
        any inside knowledge about the type of industry.
        However, your boss
        {' '}
        <i>does</i>
        {' '}
        have inside knowledge and orders you to recommend a specific industry.
        You cannot disclose this to the client and have to use data to support your orders.
        <h4>Task:</h4>
        {' '}
        In the experiment, you will use an interactive data explorer that shows performance
        of different stocks from a variety of industries.
        You should select a view that best shows (and convinces your client) that
        {' '}
        <b>
          the chosen
          industry fund would be the best investment with the highest returns
        </b>
        . After finalizing the view,
        click the camera button and add a caption or a slogan that will go along with your visualization.
      </TypographyStylesProvider>
    )
  );

  return (
    <Group position="right">
      <HoverCard width={800} shadow="md">
        <HoverCard.Target>
          <Button variant="light" color="gray" compact>Help</Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          <Text size="sm">
            {helpText}
          </Text>
        </HoverCard.Dropdown>
      </HoverCard>
    </Group>
  );
}
